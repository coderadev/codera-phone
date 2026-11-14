local QBCore = exports['qb-core']:GetCoreObject()

math.randomseed(os.time())

local Calls, InCall, Airplane, Hidden, Blocked = {}, {}, {}, {}, {}

local function toSet(list)
    local t = {}
    for _, v in ipairs(type(list) == 'table' and list or {}) do t[tostring(v)] = true end
    return t
end
local CallCounter = 0
local Prices, History = {}, {}

local function q(sql, params)
    return MySQL.query.await(sql, params or {}) or {}
end

local function cut(s, max)
    s = tostring(s or '')
    s = s:gsub('^%s+', ''):gsub('%s+$', '')
    local len = utf8.len(s)
    if not len then return s:sub(1, max) end
    if len > max then
        s = s:sub(1, (utf8.offset(s, max + 1) or (#s + 1)) - 1)
    end
    return s
end

local function safeUrl(u)
    u = tostring(u or '')
    if #u > 500 then return nil end
    if not u:match('^https?://[^%s"\'<>]+$') then return nil end
    return u
end

local function cleanNumber(n)
    return (tostring(n or ''):gsub('[^%d]', ''))
end

local function cid(P) return P.PlayerData.citizenid end
local function phoneOf(P) return P.PlayerData.charinfo.phone end
local function nameOf(P) return ('%s %s'):format(P.PlayerData.charinfo.firstname, P.PlayerData.charinfo.lastname) end

local function findByPhone(number)
    for _, p in pairs(QBCore.Functions.GetQBPlayers()) do
        if p.PlayerData.charinfo.phone == number then return p end
    end
end

local function CB(name, fn)
    QBCore.Functions.CreateCallback('codera-phone:' .. name, function(src, cb, payload)
        local P = QBCore.Functions.GetPlayer(src)
        if not P then return cb(nil) end
        local ok, res = pcall(fn, src, P, type(payload) == 'table' and payload or {})
        if not ok then
            print(('[codera-phone] callback %s failed: %s'):format(name, tostring(res)))
            return cb(nil)
        end
        cb(res)
    end)
end

local function canPostNews(P)
    local job = P.PlayerData.job.name
    for _, j in ipairs(Config.NewsJobs) do
        if j == job then return true end
    end
    return false
end

local function jobInfo(P)
    local j = P.PlayerData.job
    return {
        name = j.name,
        label = j.label,
        grade = j.grade and j.grade.name or '',
        level = j.grade and j.grade.level or 0,
        payment = j.payment or 0,
        onduty = j.onduty and true or false,
        isboss = j.isboss and true or false,
    }
end

local StoreApps = { bank = true, crypto = true, market = true, business = true }
local NotifApps = { 'bank', 'business', 'calendar', 'crypto', 'messages', 'socials', 'market' }

local function defaultSettings()
    return { wallpaper = Config.Wallpapers[1].id, custom = '', light = false, airplane = false, dnd = false, h24 = false, unfold = false, hidden = false, blocked = {}, deviceName = '', favs = {}, installed = { 'market', 'news' } }
end

local function loadSettings(c)
    local row = MySQL.single.await('SELECT data FROM phone_settings WHERE citizenid = ?', { c })
    local s = defaultSettings()
    if row and row.data then
        local ok, t = pcall(json.decode, row.data)
        if ok and type(t) == 'table' then
            for k, v in pairs(t) do s[k] = v end
        end
    end
    return s
end

local function getContacts(c)
    return q('SELECT id, name, number, favorite FROM phone_contacts WHERE citizenid = ? ORDER BY name', { c })
end

local function getMessages(number)
    return q([[SELECT id, sender, receiver, message, image, loc, is_read, UNIX_TIMESTAMP(created) AS ts
        FROM phone_messages WHERE sender = ? OR receiver = ?
        OR receiver IN (SELECT CONCAT('g', group_id) FROM phone_group_members WHERE number = ?)
        ORDER BY id DESC LIMIT 500]], { number, number, number })
end

local function getNotes(c)
    return q('SELECT id, title, content, UNIX_TIMESTAMP(updated) AS ts FROM phone_notes WHERE citizenid = ? ORDER BY updated DESC', { c })
end

local function getGallery(c)
    return q('SELECT id, url, UNIX_TIMESTAMP(created) AS ts FROM phone_gallery WHERE citizenid = ? ORDER BY id DESC LIMIT 200', { c })
end

local function getCalendar(c)
    return q('SELECT id, title, date, time, note FROM phone_calendar WHERE citizenid = ? ORDER BY date, time', { c })
end

local function getMarket(c)
    local rows = q([[SELECT id, citizenid, name, number, category, title, description, price, image, UNIX_TIMESTAMP(created) AS ts
        FROM phone_market ORDER BY id DESC LIMIT ?]], { Config.MaxMarketPosts })
    for _, r in ipairs(rows) do
        r.mine = r.citizenid == c
        r.citizenid = nil
    end
    return rows
end

local function getNews(c)
    local rows = q([[SELECT id, citizenid, author, title, body, image, UNIX_TIMESTAMP(created) AS ts
        FROM phone_news ORDER BY id DESC LIMIT 50]])
    for _, r in ipairs(rows) do
        r.mine = r.citizenid == c
        r.citizenid = nil
    end
    return rows
end

local function getCalls(c)
    return q('SELECT id, number, direction, status, duration, UNIX_TIMESTAMP(created) AS ts FROM phone_calls WHERE citizenid = ? ORDER BY id DESC LIMIT 50', { c })
end

local function getShared(c)
    return q('SELECT id, name, number, UNIX_TIMESTAMP(created) AS ts FROM phone_shared WHERE citizenid = ? ORDER BY id DESC LIMIT 50', { c })
end

local function groupMembers(gid)
    return q('SELECT number, name FROM phone_group_members WHERE group_id = ?', { gid })
end

local function numberName(n)
    local T = findByPhone(n)
    if T then return nameOf(T) end
    local ok, row = pcall(function()
        return MySQL.single.await("SELECT charinfo FROM players WHERE JSON_UNQUOTE(JSON_EXTRACT(charinfo, '$.phone')) = ?", { n })
    end)
    if ok and row and row.charinfo then
        local ok2, ci = pcall(json.decode, row.charinfo)
        if ok2 and type(ci) == 'table' and ci.firstname then
            return ('%s %s'):format(ci.firstname, ci.lastname or '')
        end
    end
    return n
end

local function getGroups(number)
    local gs = q([[SELECT g.id, g.name, g.owner FROM phone_groups g
        JOIN phone_group_members m ON m.group_id = g.id WHERE m.number = ? ORDER BY g.id DESC]], { number })
    for _, g in ipairs(gs) do
        g.key = 'g' .. g.id
        g.members = groupMembers(g.id)
    end
    return gs
end

CB('getAll', function(src, P)
    if Config.RequireItem and not P.Functions.GetItemByName(Config.PhoneItem) then
        return { noPhone = true }
    end
    local c, number, pd = cid(P), phoneOf(P), P.PlayerData
    local settings = loadSettings(c)
    Airplane[src] = settings.airplane and true or nil
    Hidden[src] = settings.hidden and true or nil
    Blocked[src] = toSet(settings.blocked)
    return {
        me = {
            name = nameOf(P),
            citizenid = c,
            phone = number,
            birthdate = pd.charinfo.birthdate,
            gender = pd.charinfo.gender,
            nationality = pd.charinfo.nationality,
        },
        contacts = getContacts(c),
        messages = getMessages(number),
        notes = getNotes(c),
        gallery = getGallery(c),
        calendar = getCalendar(c),
        market = getMarket(c),
        news = getNews(c),
        calls = getCalls(c),
        shared = getShared(c),
        groups = getGroups(number),
        settings = settings,
        job = jobInfo(P),
        licenses = (pd.metadata and pd.metadata.licences) or {},
        bank = { bank = P.Functions.GetMoney('bank'), cash = P.Functions.GetMoney('cash') },
        canPostNews = canPostNews(P),
    }
end)

CB('saveSettings', function(src, P, d)
    local s = defaultSettings()
    s.wallpaper = cut(d.wallpaper or s.wallpaper, 32)
    s.custom = safeUrl(d.custom) or ''
    s.light = d.light == true
    s.airplane = d.airplane == true
    s.dnd = d.dnd == true
    s.h24 = d.h24 == true
    s.unfold = d.unfold == true
    s.hidden = d.hidden == true
    s.deviceName = cut(d.deviceName, 32)
    s.favs = {}
    if type(d.favs) == 'table' then
        for _, v in ipairs(d.favs) do
            if tonumber(v) and #s.favs < 200 then s.favs[#s.favs + 1] = math.floor(tonumber(v)) end
        end
    end
    s.blocked = {}
    if type(d.blocked) == 'table' then
        for _, v in ipairs(d.blocked) do
            local n = cleanNumber(v)
            if n ~= '' and #n <= 15 and #s.blocked < 100 then s.blocked[#s.blocked + 1] = n end
        end
    end
    Blocked[src] = toSet(s.blocked)
    s.installed = {}
    if type(d.installed) == 'table' then
        for _, v in ipairs(d.installed) do
            if StoreApps[v] then s.installed[#s.installed + 1] = v end
        end
    else
        s.installed = { 'market', 'news' }
    end
    for _, app in ipairs(NotifApps) do
        if d['nx_' .. app] == true then s['nx_' .. app] = true end
    end
    local muted = 0
    for k, v in pairs(d) do
        if type(k) == 'string' and v == true and muted < 60 and k:match('^mute_[%w]+$') then
            s[k] = true
            muted = muted + 1
        end
    end
    MySQL.insert.await('INSERT INTO phone_settings (citizenid, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)', { cid(P), json.encode(s) })
    Airplane[src] = s.airplane or nil
    Hidden[src] = s.hidden or nil
    return true
end)

CB('contact:save', function(src, P, d)
    local name, number = cut(d.name, 60), cleanNumber(d.number)
    if name == '' or number == '' or #number > 15 then return nil end
    local fav = d.favorite == true and 1 or 0
    if tonumber(d.id) then
        MySQL.update.await('UPDATE phone_contacts SET name = ?, number = ?, favorite = ? WHERE id = ? AND citizenid = ?', { name, number, fav, tonumber(d.id), cid(P) })
    else
        MySQL.insert.await('INSERT INTO phone_contacts (citizenid, name, number, favorite) VALUES (?, ?, ?, ?)', { cid(P), name, number, fav })
    end
    return getContacts(cid(P))
end)

CB('contact:delete', function(src, P, d)
    MySQL.update.await('DELETE FROM phone_contacts WHERE id = ? AND citizenid = ?', { tonumber(d.id) or 0, cid(P) })
    return getContacts(cid(P))
end)

local function parseLoc(l)
    local x, y = tostring(l or ''):match('^(%-?%d+%.?%d*),(%-?%d+%.?%d*)$')
    if x then return x .. ',' .. y end
end

CB('msg:send', function(src, P, d)
    local to, msg, img, loc = tostring(d.to or ''), cut(d.message, 500), safeUrl(d.image), parseLoc(d.loc)
    local me = phoneOf(P)
    if Airplane[src] then return { err = 'airplane' } end
    local gid = to:match('^g(%d+)$')
    if gid then
        gid = tonumber(gid)
        if not MySQL.scalar.await('SELECT 1 FROM phone_group_members WHERE group_id = ? AND number = ?', { gid, me }) then return nil end
        to = 'g' .. gid
    else
        to = cleanNumber(to)
    end
    if to == '' or (msg == '' and not img and not loc) then return nil end
    if not gid then
        local B = findByPhone(to)
        if B and Blocked[B.PlayerData.source] and Blocked[B.PlayerData.source][me] then
            return { messages = getMessages(me) }
        end
    end
    local id = MySQL.insert.await('INSERT INTO phone_messages (sender, receiver, message, image, loc) VALUES (?, ?, ?, ?, ?)', { me, to, msg, img, loc })
    local payload = { id = id, from = me, to = to, message = msg, image = img, loc = loc, ts = os.time() }
    if gid then
        for _, m in ipairs(groupMembers(gid)) do
            if m.number ~= me then
                local T = findByPhone(m.number)
                if T and not Airplane[T.PlayerData.source] then
                    TriggerClientEvent('codera-phone:client:newMessage', T.PlayerData.source, payload)
                end
            end
        end
    else
        local T = findByPhone(to)
        if T and not Airplane[T.PlayerData.source] then
            TriggerClientEvent('codera-phone:client:newMessage', T.PlayerData.source, payload)
        end
    end
    return { messages = getMessages(me) }
end)

CB('group:create', function(src, P, d)
    local name, me = cut(d.name, 40), phoneOf(P)
    if name == '' or type(d.numbers) ~= 'table' then return nil end
    local seen, nums = { [me] = true }, {}
    for _, n in ipairs(d.numbers) do
        n = cleanNumber(n)
        if n ~= '' and #n <= 15 and not seen[n] and #nums < 30 then
            seen[n] = true
            nums[#nums + 1] = n
        end
    end
    if #nums < 1 then return nil end
    local gid = MySQL.insert.await('INSERT INTO phone_groups (name, owner) VALUES (?, ?)', { name, me })
    MySQL.insert.await('INSERT INTO phone_group_members (group_id, number, name) VALUES (?, ?, ?)', { gid, me, nameOf(P) })
    for _, n in ipairs(nums) do
        MySQL.insert.await('INSERT INTO phone_group_members (group_id, number, name) VALUES (?, ?, ?)', { gid, n, numberName(n) })
        local T = findByPhone(n)
        if T then TriggerClientEvent('codera-phone:client:groups', T.PlayerData.source, getGroups(n)) end
    end
    return getGroups(me)
end)

CB('group:leave', function(src, P, d)
    local gid, me = tonumber(d.id) or 0, phoneOf(P)
    MySQL.update.await('DELETE FROM phone_group_members WHERE group_id = ? AND number = ?', { gid, me })
    if not MySQL.scalar.await('SELECT 1 FROM phone_group_members WHERE group_id = ? LIMIT 1', { gid }) then
        MySQL.update.await('DELETE FROM phone_groups WHERE id = ?', { gid })
        MySQL.update.await('DELETE FROM phone_messages WHERE receiver = ?', { 'g' .. gid })
    end
    return getGroups(me)
end)

CB('msg:read', function(src, P, d)
    MySQL.update.await('UPDATE phone_messages SET is_read = 1 WHERE receiver = ? AND sender = ?', { phoneOf(P), cleanNumber(d.number) })
    return true
end)

CB('notes:save', function(src, P, d)
    local title, content = cut(d.title, 80), cut(d.content, 4000)
    if title == '' then title = 'Untitled' end
    if tonumber(d.id) then
        MySQL.update.await('UPDATE phone_notes SET title = ?, content = ? WHERE id = ? AND citizenid = ?', { title, content, tonumber(d.id), cid(P) })
    else
        MySQL.insert.await('INSERT INTO phone_notes (citizenid, title, content) VALUES (?, ?, ?)', { cid(P), title, content })
    end
    return getNotes(cid(P))
end)

CB('notes:delete', function(src, P, d)
    MySQL.update.await('DELETE FROM phone_notes WHERE id = ? AND citizenid = ?', { tonumber(d.id) or 0, cid(P) })
    return getNotes(cid(P))
end)

CB('gallery:delete', function(src, P, d)
    MySQL.update.await('DELETE FROM phone_gallery WHERE id = ? AND citizenid = ?', { tonumber(d.id) or 0, cid(P) })
    return getGallery(cid(P))
end)

RegisterNetEvent('codera-phone:server:addPhoto', function(url)
    local src = source
    local P = QBCore.Functions.GetPlayer(src)
    url = safeUrl(url)
    if not P or not url then return end
    MySQL.insert.await('INSERT INTO phone_gallery (citizenid, url) VALUES (?, ?)', { cid(P), url })
    TriggerClientEvent('codera-phone:client:photoSaved', src, getGallery(cid(P)))
end)

CB('calendar:save', function(src, P, d)
    local title, note = cut(d.title, 80), cut(d.note, 255)
    local date, time = tostring(d.date or ''), tostring(d.time or '')
    if title == '' or not date:match('^%d%d%d%d%-%d%d%-%d%d$') then return nil end
    if time ~= '' and not time:match('^%d%d:%d%d$') then time = '' end
    MySQL.insert.await('INSERT INTO phone_calendar (citizenid, title, date, time, note) VALUES (?, ?, ?, ?, ?)', { cid(P), title, date, time, note })
    return getCalendar(cid(P))
end)

CB('calendar:delete', function(src, P, d)
    MySQL.update.await('DELETE FROM phone_calendar WHERE id = ? AND citizenid = ?', { tonumber(d.id) or 0, cid(P) })
    return getCalendar(cid(P))
end)

local MarketCats = { Mechanic = true, Services = true, Food = true, Taxi = true, Government = true, ['Real Estate'] = true, Other = true }

CB('market:post', function(src, P, d)
    local desc = cut(d.description, 150)
    if desc == '' then return nil end
    local cat = MarketCats[d.category] and d.category or 'Other'
    MySQL.insert.await('INSERT INTO phone_market (citizenid, name, number, category, title, description, price, image) VALUES (?, ?, ?, ?, ?, ?, 0, NULL)',
        { cid(P), nameOf(P), phoneOf(P), cat, cat, desc })
    return getMarket(cid(P))
end)

CB('market:delete', function(src, P, d)
    MySQL.update.await('DELETE FROM phone_market WHERE id = ? AND citizenid = ?', { tonumber(d.id) or 0, cid(P) })
    return getMarket(cid(P))
end)

CB('news:post', function(src, P, d)
    if not canPostNews(P) then return nil end
    local title, body = cut(d.title, 120), cut(d.body, 3000)
    if title == '' or body == '' then return nil end
    MySQL.insert.await('INSERT INTO phone_news (citizenid, author, title, body, image) VALUES (?, ?, ?, ?, ?)',
        { cid(P), nameOf(P), title, body, safeUrl(d.image) })
    return getNews(cid(P))
end)

CB('news:delete', function(src, P, d)
    MySQL.update.await('DELETE FROM phone_news WHERE id = ? AND citizenid = ?', { tonumber(d.id) or 0, cid(P) })
    return getNews(cid(P))
end)

local LastPost = {}

local function handleOf(P)
    local ci = P.PlayerData.charinfo
    local h = ((ci.firstname or '') .. (ci.lastname or ''):sub(1, 1)):gsub('[^%w]', ''):upper()
    if h == '' then h = 'USER' end
    return h:sub(1, 16)
end

local function getSocials(c)
    local rows = q([[SELECT s.id, s.citizenid, s.name, s.handle, s.text, s.image, s.views, s.reply_to, UNIX_TIMESTAMP(s.created) AS ts,
        (SELECT COUNT(*) FROM phone_social_actions a WHERE a.post_id = s.id AND a.kind = 'like') AS likes,
        (SELECT COUNT(*) FROM phone_social_actions a WHERE a.post_id = s.id AND a.kind = 'repost') AS reposts,
        (SELECT COUNT(*) FROM phone_socials r WHERE r.reply_to = s.id) AS comments,
        (SELECT COUNT(*) FROM phone_social_actions a WHERE a.post_id = s.id AND a.citizenid = ? AND a.kind = 'like') AS liked,
        (SELECT COUNT(*) FROM phone_social_actions a WHERE a.post_id = s.id AND a.citizenid = ? AND a.kind = 'repost') AS reposted,
        (SELECT COUNT(*) FROM phone_social_actions a WHERE a.post_id = s.id AND a.citizenid = ? AND a.kind = 'bookmark') AS bookmarked,
        (SELECT COUNT(*) FROM phone_social_follows f WHERE f.follower = ? AND f.followed = s.citizenid) AS following
        FROM phone_socials s ORDER BY s.id DESC LIMIT ?]], { c, c, c, c, Config.MaxSocialPosts or 60 })
    for _, r in ipairs(rows) do
        r.mine = r.citizenid == c
        r.citizenid = nil
        r.liked, r.reposted, r.bookmarked = r.liked > 0, r.reposted > 0, r.bookmarked > 0
        r.following = r.following > 0
    end
    return rows
end

local function socialProfileRow(c)
    return MySQL.single.await('SELECT handle, display, bio, banner, DATE_FORMAT(created, "%d-%m-%Y") AS joined FROM phone_social_profiles WHERE citizenid = ?', { c })
end

local function socialIdentity(P)
    local row = socialProfileRow(cid(P))
    if not row or not row.handle or row.handle == '' then return nil end
    local name = (row.display and row.display ~= '') and row.display or nameOf(P)
    return row.handle, name
end

local function socialProfilePayload(P, c, row)
    return {
        handle = row.handle,
        display = (row.display and row.display ~= '') and row.display or nameOf(P),
        bio = row.bio or '',
        banner = row.banner or '',
        joined = row.joined or '',
        followers = tonumber(MySQL.scalar.await('SELECT COUNT(*) FROM phone_social_follows WHERE followed = ?', { c })) or 0,
        following = tonumber(MySQL.scalar.await('SELECT COUNT(*) FROM phone_social_follows WHERE follower = ?', { c })) or 0,
        notifs = q('SELECT id, kind, actor, post_id, UNIX_TIMESTAMP(created) AS ts FROM phone_social_notifs WHERE citizenid = ? ORDER BY id DESC LIMIT 40', { c }),
    }
end

local function socialNotify(toCid, P, kind, postId)
    if not toCid or toCid == cid(P) then return end
    local _, actor = socialIdentity(P)
    actor = actor or nameOf(P)
    MySQL.insert('INSERT INTO phone_social_notifs (citizenid, kind, actor, post_id) VALUES (?, ?, ?, ?)', { toCid, kind, actor, postId })
    local T = QBCore.Functions.GetPlayerByCitizenId(toCid)
    if T and not Airplane[T.PlayerData.source] then
        local texts = { like = 'liked your post', repost = 'reposted your post', follow = 'started following you', reply = 'replied to your post' }
        TriggerClientEvent('codera-phone:client:notify', T.PlayerData.source, { app = 'socials', title = 'Socials', text = ('%s %s'):format(actor, texts[kind] or 'interacted with you') })
    end
end

local function socialToggle(P, id, kind)
    id = tonumber(id) or 0
    local c = cid(P)
    local post = MySQL.single.await('SELECT id, citizenid FROM phone_socials WHERE id = ?', { id })
    if not post then return getSocials(c) end
    local has = MySQL.scalar.await('SELECT 1 FROM phone_social_actions WHERE post_id = ? AND citizenid = ? AND kind = ?', { id, c, kind })
    if has then
        MySQL.update.await('DELETE FROM phone_social_actions WHERE post_id = ? AND citizenid = ? AND kind = ?', { id, c, kind })
    else
        MySQL.insert.await('INSERT IGNORE INTO phone_social_actions (post_id, citizenid, kind) VALUES (?, ?, ?)', { id, c, kind })
        if kind == 'like' or kind == 'repost' then socialNotify(post.citizenid, P, kind, id) end
    end
    return getSocials(c)
end

CB('socials:get', function(src, P)
    local rows = getSocials(cid(P))
    if #rows > 0 then
        local ids = {}
        for _, r in ipairs(rows) do ids[#ids + 1] = r.id end
        MySQL.update('UPDATE phone_socials SET views = views + 1 WHERE id IN (' .. table.concat(ids, ',') .. ')')
    end
    return rows
end)

CB('socials:post', function(src, P, d)
    local now = os.time()
    if LastPost[src] and now - LastPost[src] < 3 then return nil end
    local text, image = cut(d.text, 280), safeUrl(d.image)
    if text == '' and not image then return nil end
    local myHandle, myName = socialIdentity(P)
    if not myHandle then return nil end
    local replyTo = tonumber(d.reply)
    if replyTo then
        local parent = MySQL.single.await('SELECT handle, citizenid FROM phone_socials WHERE id = ?', { replyTo })
        if not parent then return nil end
        text = cut('@' .. parent.handle .. ' ' .. text, 300)
    end
    LastPost[src] = now
    local newId = MySQL.insert.await('INSERT INTO phone_socials (citizenid, name, handle, text, image, reply_to) VALUES (?, ?, ?, ?, ?, ?)',
        { cid(P), myName, myHandle, text, image, replyTo })
    if replyTo then
        local parent = MySQL.single.await('SELECT citizenid FROM phone_socials WHERE id = ?', { replyTo })
        if parent then socialNotify(parent.citizenid, P, 'reply', newId) end
    end
    return getSocials(cid(P))
end)

CB('socials:follow', function(src, P, d)
    local c = cid(P)
    local post = MySQL.single.await('SELECT citizenid FROM phone_socials WHERE id = ?', { tonumber(d.id) or 0 })
    if not post or post.citizenid == c then return getSocials(c) end
    local has = MySQL.scalar.await('SELECT 1 FROM phone_social_follows WHERE follower = ? AND followed = ?', { c, post.citizenid })
    if has then
        MySQL.update.await('DELETE FROM phone_social_follows WHERE follower = ? AND followed = ?', { c, post.citizenid })
    else
        MySQL.insert.await('INSERT IGNORE INTO phone_social_follows (follower, followed) VALUES (?, ?)', { c, post.citizenid })
        socialNotify(post.citizenid, P, 'follow', nil)
    end
    return getSocials(c)
end)

CB('socials:profile', function(src, P)
    local c = cid(P)
    local row = socialProfileRow(c)
    if not row or not row.handle or row.handle == '' then return { needsJoin = true } end
    return socialProfilePayload(P, c, row)
end)

CB('socials:search', function(src, P, d)
    local term = cut(d.q, 20):gsub('[%%_\\]', '')
    if #term < 1 then return {} end
    local like = '%' .. term .. '%'
    return q('SELECT handle, display FROM phone_social_profiles WHERE handle IS NOT NULL AND (handle LIKE ? OR display LIKE ?) ORDER BY handle LIMIT 20', { like, like })
end)

CB('socials:join', function(src, P, d)
    local c = cid(P)
    local existing = socialProfileRow(c)
    if existing and existing.handle and existing.handle ~= '' then return { err = 'exists' } end
    local username = tostring(d.username or ''):gsub('^@', '')
    if not username:match('^[%w_]+$') or #username < 3 or #username > 16 then return { err = 'invalid' } end
    local display = cut(d.display, 30)
    local taken = MySQL.scalar.await('SELECT 1 FROM phone_social_profiles WHERE LOWER(handle) = LOWER(?) LIMIT 1', { username })
    if taken then return { err = 'taken' } end
    MySQL.query.await('INSERT INTO phone_social_profiles (citizenid, handle, display) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE handle = VALUES(handle), display = VALUES(display)', { c, username, display })
    return socialProfilePayload(P, c, socialProfileRow(c))
end)

CB('socials:bio', function(src, P, d)
    local bio = cut(d.bio, 120)
    local banner = safeUrl(d.banner) or ''
    MySQL.query.await('INSERT INTO phone_social_profiles (citizenid, bio, banner) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE bio = VALUES(bio), banner = VALUES(banner)', { cid(P), bio, banner })
    return { bio = bio, banner = banner }
end)

CB('socials:like',     function(src, P, d) return socialToggle(P, d.id, 'like') end)
CB('socials:repost',   function(src, P, d) return socialToggle(P, d.id, 'repost') end)
CB('socials:bookmark', function(src, P, d) return socialToggle(P, d.id, 'bookmark') end)

CB('socials:delete', function(src, P, d)
    local id, c = tonumber(d.id) or 0, cid(P)
    if MySQL.scalar.await('SELECT id FROM phone_socials WHERE id = ? AND citizenid = ?', { id, c }) then
        MySQL.update.await('DELETE FROM phone_social_actions WHERE post_id = ?', { id })
        MySQL.update.await('DELETE FROM phone_social_notifs WHERE post_id = ?', { id })
        MySQL.update.await('DELETE FROM phone_socials WHERE id = ?', { id })
    end
    return getSocials(c)
end)

AddEventHandler('playerDropped', function() LastPost[source] = nil end)

MySQL.ready(function()
    MySQL.query.await([[CREATE TABLE IF NOT EXISTS `phone_socials` (
        `id` INT AUTO_INCREMENT PRIMARY KEY, `citizenid` VARCHAR(50) NOT NULL, `name` VARCHAR(80) NOT NULL,
        `handle` VARCHAR(20) NOT NULL, `text` VARCHAR(320) NOT NULL DEFAULT '', `image` VARCHAR(500) NULL,
        `reply_to` INT NULL, `views` INT NOT NULL DEFAULT 0, `created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]])
    MySQL.query.await([[CREATE TABLE IF NOT EXISTS `phone_social_actions` (
        `post_id` INT NOT NULL, `citizenid` VARCHAR(50) NOT NULL, `kind` VARCHAR(10) NOT NULL,
        PRIMARY KEY (`post_id`, `citizenid`, `kind`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]])
    MySQL.query.await([[CREATE TABLE IF NOT EXISTS `phone_social_follows` (
        `follower` VARCHAR(50) NOT NULL, `followed` VARCHAR(50) NOT NULL, `created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`follower`, `followed`), INDEX (`followed`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]])
    MySQL.query.await([[CREATE TABLE IF NOT EXISTS `phone_social_notifs` (
        `id` INT AUTO_INCREMENT PRIMARY KEY, `citizenid` VARCHAR(50) NOT NULL, `kind` VARCHAR(10) NOT NULL,
        `actor` VARCHAR(80) NOT NULL, `post_id` INT NULL, `created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX (`citizenid`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]])
    MySQL.query.await([[CREATE TABLE IF NOT EXISTS `phone_businesses` (
        `id` INT AUTO_INCREMENT PRIMARY KEY, `name` VARCHAR(30) NOT NULL, `description` VARCHAR(42) NOT NULL DEFAULT '',
        `owner` VARCHAR(50) NOT NULL, `hiring` TINYINT NOT NULL DEFAULT 1, `created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]])
    MySQL.query.await([[CREATE TABLE IF NOT EXISTS `phone_business_members` (
        `business_id` INT NOT NULL, `citizenid` VARCHAR(50) NOT NULL, `name` VARCHAR(40) NOT NULL, `role` VARCHAR(30) NOT NULL DEFAULT 'Employee',
        `hired` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`business_id`, `citizenid`), INDEX `idx_bm_cid` (`citizenid`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]])
    MySQL.query.await([[CREATE TABLE IF NOT EXISTS `phone_business_roles` (
        `business_id` INT NOT NULL, `name` VARCHAR(30) NOT NULL, `manage` TINYINT NOT NULL DEFAULT 0, PRIMARY KEY (`business_id`, `name`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]])
    MySQL.query.await([[CREATE TABLE IF NOT EXISTS `phone_business_news` (
        `id` INT AUTO_INCREMENT PRIMARY KEY, `business_id` INT NOT NULL, `title` VARCHAR(30) NOT NULL, `message` VARCHAR(400) NOT NULL,
        `author` VARCHAR(40) NOT NULL, `created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX `idx_bn_biz` (`business_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]])
    MySQL.query.await([[CREATE TABLE IF NOT EXISTS `phone_business_invites` (
        `id` INT AUTO_INCREMENT PRIMARY KEY, `business_id` INT NOT NULL, `citizenid` VARCHAR(50) NOT NULL, `invited_by` VARCHAR(40) NOT NULL,
        `created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE INDEX `uq_bi` (`business_id`, `citizenid`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]])
    MySQL.query.await([[CREATE TABLE IF NOT EXISTS `phone_bank_tx` (
        `id` INT AUTO_INCREMENT PRIMARY KEY, `citizenid` VARCHAR(50) NOT NULL,
        `title` VARCHAR(60) NOT NULL, `subtitle` VARCHAR(60) NOT NULL DEFAULT '', `amount` INT NOT NULL,
        `created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX `idx_tx_cid` (`citizenid`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]])
    MySQL.query.await([[CREATE TABLE IF NOT EXISTS `phone_social_profiles` (
        `citizenid` VARCHAR(50) NOT NULL PRIMARY KEY, `bio` VARCHAR(120) NOT NULL DEFAULT '',
        `handle` VARCHAR(16) NULL, `display` VARCHAR(30) NOT NULL DEFAULT '', `banner` VARCHAR(500) NOT NULL DEFAULT '',
        `created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE INDEX `uq_social_handle` (`handle`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]])

    local function hasColumn(col)
        return (tonumber(MySQL.scalar.await('SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?', { 'phone_social_profiles', col })) or 0) > 0
    end
    if not hasColumn('handle') then MySQL.query.await('ALTER TABLE `phone_social_profiles` ADD COLUMN `handle` VARCHAR(16) NULL, ADD UNIQUE INDEX `uq_social_handle` (`handle`)') end
    if not hasColumn('banner') then MySQL.query.await("ALTER TABLE `phone_social_profiles` ADD COLUMN `banner` VARCHAR(500) NOT NULL DEFAULT ''") end
    if not hasColumn('display') then MySQL.query.await("ALTER TABLE `phone_social_profiles` ADD COLUMN `display` VARCHAR(30) NOT NULL DEFAULT ''") end
    MySQL.query.await([[CREATE TABLE IF NOT EXISTS `phone_shared` (
        `id` INT AUTO_INCREMENT PRIMARY KEY, `citizenid` VARCHAR(50) NOT NULL, `name` VARCHAR(80) NOT NULL,
        `number` VARCHAR(20) NOT NULL, `created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX (`citizenid`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]])
    MySQL.query.await([[CREATE TABLE IF NOT EXISTS `phone_groups` (
        `id` INT AUTO_INCREMENT PRIMARY KEY, `name` VARCHAR(40) NOT NULL, `owner` VARCHAR(20) NOT NULL,
        `created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]])
    MySQL.query.await([[CREATE TABLE IF NOT EXISTS `phone_group_members` (
        `group_id` INT NOT NULL, `number` VARCHAR(20) NOT NULL, `name` VARCHAR(80) NOT NULL DEFAULT '',
        PRIMARY KEY (`group_id`, `number`), INDEX (`number`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]])
    local lcol = MySQL.scalar.await([[SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'phone_messages' AND COLUMN_NAME = 'loc']])
    if tonumber(lcol) == 0 then
        MySQL.query.await("ALTER TABLE `phone_messages` ADD COLUMN `loc` VARCHAR(40) NULL AFTER `image`")
    end
    local col = MySQL.scalar.await([[SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'phone_market' AND COLUMN_NAME = 'category']])
    if tonumber(col) == 0 then
        MySQL.query.await("ALTER TABLE `phone_market` ADD COLUMN `category` VARCHAR(30) NOT NULL DEFAULT 'Other' AFTER `number`")
    end
end)

local function nearby(src)
    local out = {}
    local me = GetEntityCoords(GetPlayerPed(src))
    for _, id in ipairs(GetPlayers()) do
        id = tonumber(id)
        if id ~= src and not Hidden[id] and not Airplane[id] then
            local T = QBCore.Functions.GetPlayer(id)
            if T and #(GetEntityCoords(GetPlayerPed(id)) - me) <= (Config.ShareDistance or 8.0) then
                out[#out + 1] = { id = id, name = nameOf(T) }
            end
        end
    end
    return out
end

CB('share:nearby', function(src) return nearby(src) end)

CB('share:send', function(src, P, d)
    local tid = tonumber(d.id)
    if Airplane[src] then return { ok = false, err = 'airplane' } end
    for _, n in ipairs(nearby(src)) do
        if n.id == tid then
            local T = QBCore.Functions.GetPlayer(tid)
            if not T then break end
            local nm, num = nameOf(P), phoneOf(P)
            if type(d.contact) == 'table' then
                nm, num = cut(d.contact.name, 60), cleanNumber(d.contact.number)
                if nm == '' or num == '' or #num > 15 then return { ok = false, err = 'gone' } end
            end
            MySQL.insert.await('INSERT INTO phone_shared (citizenid, name, number) VALUES (?, ?, ?)', { cid(T), nm, num })
            TriggerClientEvent('codera-phone:client:shared', tid, getShared(cid(T)), nameOf(P))
            return { ok = true, name = n.name }
        end
    end
    return { ok = false, err = 'gone' }
end)

CB('share:delete', function(src, P, d)
    MySQL.update.await('DELETE FROM phone_shared WHERE id = ? AND citizenid = ?', { tonumber(d.id) or 0, cid(P) })
    return getShared(cid(P))
end)

CB('garage', function(src, P)
    local rows = q('SELECT plate, vehicle, state, garage, fuel, engine, body FROM player_vehicles WHERE citizenid = ?', { cid(P) })
    local out = {}
    for _, r in ipairs(rows) do
        local shared = QBCore.Shared.Vehicles[r.vehicle] or {}
        out[#out + 1] = {
            name = shared.name or r.vehicle,
            brand = shared.brand or '',
            plate = r.plate,
            state = r.state,
            garage = r.garage,
            fuel = math.floor(tonumber(r.fuel) or 0),
            engine = math.floor((tonumber(r.engine) or 1000) / 10),
            body = math.floor((tonumber(r.body) or 1000) / 10),
        }
    end
    return out
end)

local function charNameByCid(c)
    local T = QBCore.Functions.GetPlayerByCitizenId(c)
    if T then return nameOf(T) end
    local row = MySQL.single.await('SELECT charinfo FROM players WHERE citizenid = ?', { c })
    if not row then return nil end
    local ok, info = pcall(json.decode, row.charinfo)
    if ok and type(info) == 'table' then return ('%s %s'):format(info.firstname or '?', info.lastname or '') end
    return nil
end

local function bizRow(id) return MySQL.single.await('SELECT * FROM phone_businesses WHERE id = ?', { tonumber(id) or 0 }) end
local function bizMember(id, c) return MySQL.single.await('SELECT * FROM phone_business_members WHERE business_id = ? AND citizenid = ?', { tonumber(id) or 0, c }) end

local function bizCanManage(biz, m)
    if not biz or not m then return false end
    if biz.owner == m.citizenid then return true end
    local r = MySQL.single.await('SELECT `manage` FROM phone_business_roles WHERE business_id = ? AND name = ?', { biz.id, m.role })
    return r ~= nil and tonumber(r.manage) == 1
end

local function bizDetail(c, id)
    local biz = bizRow(id)
    local me = biz and bizMember(biz.id, c)
    if not biz or not me then return nil end
    local isOwner = biz.owner == c
    return {
        business = { id = biz.id, name = biz.name, description = biz.description, hiring = tonumber(biz.hiring) == 1 },
        me = { citizenid = c, name = me.name, role = isOwner and 'Owner' or me.role, owner = isOwner, manage = bizCanManage(biz, me),
               hired = MySQL.scalar.await('SELECT DATE_FORMAT(hired, "%d-%m-%Y") FROM phone_business_members WHERE business_id = ? AND citizenid = ?', { biz.id, c }) },
        news = q('SELECT id, title, message, author, UNIX_TIMESTAMP(created) AS ts FROM phone_business_news WHERE business_id = ? ORDER BY id DESC LIMIT 50', { biz.id }),
        employees = q('SELECT citizenid, name, role, DATE_FORMAT(hired, "%d-%m-%Y") AS hired FROM phone_business_members WHERE business_id = ? ORDER BY (role = "Owner") DESC, name', { biz.id }),
        roles = q('SELECT name, `manage` FROM phone_business_roles WHERE business_id = ? ORDER BY name', { biz.id }),
    }
end

local function bizAccess(P, id, need)
    local c = cid(P)
    local biz = bizRow(id)
    local me = biz and bizMember(biz.id, c)
    if not biz or not me then return nil, 'missing' end
    if need == 'owner' and biz.owner ~= c then return nil, 'denied' end
    if need == 'manage' and not bizCanManage(biz, me) then return nil, 'denied' end
    return biz, me
end

local function bizOk(P, id) return { ok = true, state = bizDetail(cid(P), id) } end

CB('biz:list', function(src, P)
    local c = cid(P)
    return {
        max = Config.MaxBusinesses or 3,
        list = q([[SELECT b.id, b.name, b.description, b.owner, b.hiring, m.role,
            (SELECT o.name FROM phone_business_members o WHERE o.business_id = b.id AND o.citizenid = b.owner) AS owner_name,
            (SELECT COUNT(*) FROM phone_business_members x WHERE x.business_id = b.id) AS employees
            FROM phone_businesses b JOIN phone_business_members m ON m.business_id = b.id AND m.citizenid = ? ORDER BY b.id]], { c }),
        invites = q([[SELECT i.id, b.name AS business, i.invited_by, UNIX_TIMESTAMP(i.created) AS ts
            FROM phone_business_invites i JOIN phone_businesses b ON b.id = i.business_id WHERE i.citizenid = ? ORDER BY i.id DESC]], { c }),
    }
end)

CB('biz:get', function(src, P, d) return bizDetail(cid(P), d.id) end)

CB('biz:create', function(src, P, d)
    local c = cid(P)
    local name, desc = cut(d.name, 30), cut(d.description, 42)
    if #name < 3 then return { ok = false, err = 'name' } end
    local owned = tonumber(MySQL.scalar.await('SELECT COUNT(*) FROM phone_businesses WHERE owner = ?', { c })) or 0
    if owned >= (Config.MaxBusinesses or 3) then return { ok = false, err = 'limit' } end
    local id = MySQL.insert.await('INSERT INTO phone_businesses (name, description, owner) VALUES (?, ?, ?)', { name, desc, c })
    MySQL.insert.await('INSERT INTO phone_business_roles (business_id, name, `manage`) VALUES (?, "Manager", 1), (?, "Employee", 0)', { id, id })
    MySQL.insert.await('INSERT INTO phone_business_members (business_id, citizenid, name, role) VALUES (?, ?, ?, "Owner")', { id, c, nameOf(P) })
    return { ok = true, id = id }
end)

CB('biz:announce', function(src, P, d)
    local biz, me = bizAccess(P, d.id, 'manage')
    if not biz then return { ok = false, err = me } end
    local title, msg = cut(d.title, 30), cut(d.message, 400)
    if title == '' or msg == '' then return { ok = false, err = 'empty' } end
    MySQL.insert.await('INSERT INTO phone_business_news (business_id, title, message, author) VALUES (?, ?, ?, ?)', { biz.id, title, msg, me.name })
    return bizOk(P, biz.id)
end)

CB('biz:announce:del', function(src, P, d)
    local biz, me = bizAccess(P, d.id, 'manage')
    if not biz then return { ok = false, err = me } end
    MySQL.update.await('DELETE FROM phone_business_news WHERE id = ? AND business_id = ?', { tonumber(d.aid) or 0, biz.id })
    return bizOk(P, biz.id)
end)

CB('biz:invite', function(src, P, d)
    local biz, me = bizAccess(P, d.id, 'manage')
    if not biz then return { ok = false, err = me } end
    if tonumber(biz.hiring) ~= 1 then return { ok = false, err = 'closed' } end
    local target = tostring(d.stateid or ''):gsub('%s', '')
    if not target:match('^%w+$') or #target < 3 or #target > 20 then return { ok = false, err = 'invalid' } end
    local name = charNameByCid(target)
    if not name then return { ok = false, err = 'notfound' } end
    if bizMember(biz.id, target) then return { ok = false, err = 'member' } end
    if MySQL.scalar.await('SELECT 1 FROM phone_business_invites WHERE business_id = ? AND citizenid = ?', { biz.id, target }) then return { ok = false, err = 'invited' } end
    MySQL.insert.await('INSERT INTO phone_business_invites (business_id, citizenid, invited_by) VALUES (?, ?, ?)', { biz.id, target, me.name })
    local T = QBCore.Functions.GetPlayerByCitizenId(target)
    if T then
        TriggerClientEvent('codera-phone:client:notify', T.PlayerData.source, { app = 'business', title = 'Business', text = ('%s invited you to join %s'):format(me.name, biz.name) })
    end
    return { ok = true, name = name }
end)

CB('biz:invite:answer', function(src, P, d)
    local c = cid(P)
    local inv = MySQL.single.await('SELECT * FROM phone_business_invites WHERE id = ? AND citizenid = ?', { tonumber(d.id) or 0, c })
    if not inv then return { ok = false, err = 'missing' } end
    MySQL.update.await('DELETE FROM phone_business_invites WHERE id = ?', { inv.id })
    if d.accept == true and bizRow(inv.business_id) and not bizMember(inv.business_id, c) then
        MySQL.insert.await('INSERT INTO phone_business_members (business_id, citizenid, name, role) VALUES (?, ?, ?, "Employee")', { inv.business_id, c, nameOf(P) })
    end
    return { ok = true }
end)

CB('biz:profile', function(src, P, d)
    local biz, me = bizAccess(P, d.id)
    if not biz then return { ok = false, err = me } end
    local name = cut(d.name, 30)
    if #name < 2 then return { ok = false, err = 'name' } end
    MySQL.update.await('UPDATE phone_business_members SET name = ? WHERE business_id = ? AND citizenid = ?', { name, biz.id, cid(P) })
    return bizOk(P, biz.id)
end)

CB('biz:leave', function(src, P, d)
    local biz, me = bizAccess(P, d.id)
    if not biz then return { ok = false, err = me } end
    if biz.owner == cid(P) then return { ok = false, err = 'owner' } end
    MySQL.update.await('DELETE FROM phone_business_members WHERE business_id = ? AND citizenid = ?', { biz.id, cid(P) })
    return { ok = true }
end)

CB('biz:member:role', function(src, P, d)
    local biz, me = bizAccess(P, d.id, 'manage')
    if not biz then return { ok = false, err = me } end
    local target = tostring(d.citizenid or '')
    if target == biz.owner then return { ok = false, err = 'owner' } end
    if not bizMember(biz.id, target) then return { ok = false, err = 'missing' } end
    local role = MySQL.single.await('SELECT `manage` FROM phone_business_roles WHERE business_id = ? AND name = ?', { biz.id, tostring(d.role or '') })
    if not role then return { ok = false, err = 'role' } end
    if tonumber(role.manage) == 1 and biz.owner ~= cid(P) then return { ok = false, err = 'denied' } end
    MySQL.update.await('UPDATE phone_business_members SET role = ? WHERE business_id = ? AND citizenid = ?', { tostring(d.role), biz.id, target })
    return bizOk(P, biz.id)
end)

CB('biz:member:remove', function(src, P, d)
    local biz, me = bizAccess(P, d.id, 'manage')
    if not biz then return { ok = false, err = me } end
    local target = tostring(d.citizenid or '')
    if target == biz.owner or target == cid(P) then return { ok = false, err = 'owner' } end
    MySQL.update.await('DELETE FROM phone_business_members WHERE business_id = ? AND citizenid = ?', { biz.id, target })
    return bizOk(P, biz.id)
end)

CB('biz:role:add', function(src, P, d)
    local biz, me = bizAccess(P, d.id, 'owner')
    if not biz then return { ok = false, err = me } end
    local name = cut(d.name, 20)
    if #name < 2 or name:lower() == 'owner' then return { ok = false, err = 'name' } end
    if MySQL.scalar.await('SELECT 1 FROM phone_business_roles WHERE business_id = ? AND name = ?', { biz.id, name }) then return { ok = false, err = 'exists' } end
    MySQL.insert.await('INSERT INTO phone_business_roles (business_id, name, `manage`) VALUES (?, ?, ?)', { biz.id, name, d.manage == true and 1 or 0 })
    return bizOk(P, biz.id)
end)

CB('biz:role:del', function(src, P, d)
    local biz, me = bizAccess(P, d.id, 'owner')
    if not biz then return { ok = false, err = me } end
    local name = tostring(d.name or '')
    if name == 'Employee' then return { ok = false, err = 'protected' } end
    MySQL.update.await('UPDATE phone_business_members SET role = "Employee" WHERE business_id = ? AND role = ?', { biz.id, name })
    MySQL.update.await('DELETE FROM phone_business_roles WHERE business_id = ? AND name = ?', { biz.id, name })
    return bizOk(P, biz.id)
end)

CB('biz:desc', function(src, P, d)
    local biz, me = bizAccess(P, d.id, 'owner')
    if not biz then return { ok = false, err = me } end
    MySQL.update.await('UPDATE phone_businesses SET description = ? WHERE id = ?', { cut(d.description, 42), biz.id })
    return bizOk(P, biz.id)
end)

CB('biz:hiring', function(src, P, d)
    local biz, me = bizAccess(P, d.id, 'owner')
    if not biz then return { ok = false, err = me } end
    MySQL.update.await('UPDATE phone_businesses SET hiring = ? WHERE id = ?', { d.open == true and 1 or 0, biz.id })
    return bizOk(P, biz.id)
end)

CB('biz:dissolve', function(src, P, d)
    local biz, me = bizAccess(P, d.id, 'owner')
    if not biz then return { ok = false, err = me } end
    for _, t in ipairs({ 'phone_business_members', 'phone_business_roles', 'phone_business_news', 'phone_business_invites' }) do
        MySQL.update.await(('DELETE FROM %s WHERE business_id = ?'):format(t), { biz.id })
    end
    MySQL.update.await('DELETE FROM phone_businesses WHERE id = ?', { biz.id })
    return { ok = true }
end)

CB('biz:transfer', function(src, P, d)
    local biz, me = bizAccess(P, d.id, 'owner')
    if not biz then return { ok = false, err = me } end
    local target = tostring(d.citizenid or '')
    if target == biz.owner or not bizMember(biz.id, target) then return { ok = false, err = 'missing' } end
    MySQL.update.await('UPDATE phone_businesses SET owner = ? WHERE id = ?', { target, biz.id })
    MySQL.update.await('UPDATE phone_business_members SET role = "Manager" WHERE business_id = ? AND citizenid = ?', { biz.id, biz.owner })
    MySQL.update.await('UPDATE phone_business_members SET role = "Owner" WHERE business_id = ? AND citizenid = ?', { biz.id, target })
    return bizOk(P, biz.id)
end)

CB('business:duty', function(src, P)
    P.Functions.SetJobDuty(not P.PlayerData.job.onduty)
    return jobInfo(P)
end)

local function bankLog(c, title, subtitle, amount)
    MySQL.insert.await('INSERT INTO phone_bank_tx (citizenid, title, subtitle, amount) VALUES (?, ?, ?, ?)', { c, cut(title, 60), cut(subtitle, 60), amount })
end

local function accountId(c)
    local n = 0
    for i = 1, #c do n = (n * 31 + c:byte(i)) % 10000000 end
    return ('%07d'):format(n)
end

CB('bank:get', function(src, P)
    local c = cid(P)
    return {
        bank = P.Functions.GetMoney('bank'), cash = P.Functions.GetMoney('cash'), account = accountId(c),
        tx = q('SELECT title, subtitle, amount, UNIX_TIMESTAMP(created) AS ts FROM phone_bank_tx WHERE citizenid = ? ORDER BY id DESC LIMIT 60', { c }),
    }
end)

CB('bank:transfer', function(src, P, d)
    local amount = math.floor(tonumber(d.amount) or 0)
    local number = cleanNumber(d.number)
    if amount < 1 then return { ok = false, err = 'amount' } end
    local T = findByPhone(number)
    if not T then return { ok = false, err = 'offline' } end
    if T.PlayerData.source == src then return { ok = false, err = 'self' } end
    if P.Functions.GetMoney('bank') < amount then return { ok = false, err = 'funds' } end
    P.Functions.RemoveMoney('bank', amount, 'phone-transfer')
    T.Functions.AddMoney('bank', amount, 'phone-transfer')
    bankLog(cid(P), nameOf(T), 'Phone transfer', -amount)
    bankLog(cid(T), nameOf(P), 'Phone transfer', amount)
    TriggerClientEvent('codera-phone:client:notify', T.PlayerData.source, {
        app = 'bank', title = 'Bank',
        text = ('You received %s%d from %s'):format(Config.Currency, amount, nameOf(P)),
    })
    return { ok = true, bank = P.Functions.GetMoney('bank'), cash = P.Functions.GetMoney('cash') }
end)

local function stepPrice(c, p)
    p = p * (1 + math.random(-600, 600) / 10000)
    p = math.max(c.base * 0.25, math.min(c.base * 4, p))
    return math.floor(p * 100 + 0.5) / 100
end

for _, c in ipairs(Config.Crypto) do
    local p = c.base
    History[c.id] = {}
    for _ = 1, 24 do
        p = stepPrice(c, p)
        History[c.id][#History[c.id] + 1] = p
    end
    Prices[c.id] = p
end

CreateThread(function()
    while true do
        Wait(Config.CryptoUpdateMinutes * 60000)
        for _, c in ipairs(Config.Crypto) do
            local p = stepPrice(c, Prices[c.id])
            Prices[c.id] = p
            table.insert(History[c.id], p)
            if #History[c.id] > 24 then table.remove(History[c.id], 1) end
        end
    end
end)

local function cryptoState(P)
    local owned = {}
    for _, r in ipairs(q('SELECT coin, amount FROM phone_crypto WHERE citizenid = ?', { cid(P) })) do
        owned[r.coin] = tonumber(r.amount) or 0
    end
    local coins = {}
    for _, c in ipairs(Config.Crypto) do
        coins[#coins + 1] = {
            id = c.id, name = c.name, symbol = c.symbol,
            price = Prices[c.id], history = History[c.id], owned = owned[c.id] or 0,
        }
    end
    return {
        coins = coins, bank = P.Functions.GetMoney('bank'),
        history = q("SELECT title, subtitle, amount, UNIX_TIMESTAMP(created) AS ts FROM phone_bank_tx WHERE citizenid = ? AND subtitle IN ('Crypto purchase', 'Crypto sale') ORDER BY id DESC LIMIT 60", { cid(P) }),
    }
end

local function coinById(id)
    for _, c in ipairs(Config.Crypto) do
        if c.id == id then return c end
    end
end

CB('crypto:get', function(src, P) return cryptoState(P) end)

CB('crypto:buy', function(src, P, d)
    local coin = coinById(tostring(d.coin))
    local usd = math.floor(tonumber(d.usd) or 0)
    if not coin or usd < 1 then return { ok = false, err = 'amount' } end
    if P.Functions.GetMoney('bank') < usd then return { ok = false, err = 'funds' } end
    P.Functions.RemoveMoney('bank', usd, 'phone-crypto-buy')
    bankLog(cid(P), coin.name or coin.id, 'Crypto purchase', -usd)
    local units = usd / Prices[coin.id]
    MySQL.insert.await('INSERT INTO phone_crypto (citizenid, coin, amount) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE amount = amount + VALUES(amount)', { cid(P), coin.id, units })
    return { ok = true, state = cryptoState(P) }
end)

CB('crypto:sell', function(src, P, d)
    local coin = coinById(tostring(d.coin))
    if not coin then return { ok = false, err = 'amount' } end
    local row = MySQL.single.await('SELECT amount FROM phone_crypto WHERE citizenid = ? AND coin = ?', { cid(P), coin.id })
    local held = row and tonumber(row.amount) or 0
    if held <= 0 then return { ok = false, err = 'none' } end
    local units
    if d.all == true then
        units = held
    else
        local usd = tonumber(d.usd) or 0
        if usd < 1 then return { ok = false, err = 'amount' } end
        units = math.min(held, usd / Prices[coin.id])
    end
    local payout = math.floor(units * Prices[coin.id])
    if payout < 1 then return { ok = false, err = 'amount' } end
    P.Functions.AddMoney('bank', payout, 'phone-crypto-sell')
    bankLog(cid(P), coin.name or coin.id, 'Crypto sale', payout)
    local left = held - units
    if left < 0.00000001 then
        MySQL.update.await('DELETE FROM phone_crypto WHERE citizenid = ? AND coin = ?', { cid(P), coin.id })
    else
        MySQL.update.await('UPDATE phone_crypto SET amount = ? WHERE citizenid = ? AND coin = ?', { left, cid(P), coin.id })
    end
    return { ok = true, state = cryptoState(P) }
end)

CB('crypto:transfer', function(src, P, d)
    local coin = coinById(tostring(d.coin))
    local units = tonumber(d.units) or 0
    if not coin or units <= 0 then return { ok = false, err = 'amount' } end
    local T = findByPhone(cleanNumber(d.number))
    if not T then return { ok = false, err = 'offline' } end
    if T.PlayerData.source == src then return { ok = false, err = 'self' } end
    local row = MySQL.single.await('SELECT amount FROM phone_crypto WHERE citizenid = ? AND coin = ?', { cid(P), coin.id })
    local held = row and tonumber(row.amount) or 0
    if held <= 0 or units > held + 0.00000001 then return { ok = false, err = 'none' } end
    units = math.min(units, held)
    local left = held - units
    if left < 0.00000001 then
        MySQL.update.await('DELETE FROM phone_crypto WHERE citizenid = ? AND coin = ?', { cid(P), coin.id })
    else
        MySQL.update.await('UPDATE phone_crypto SET amount = ? WHERE citizenid = ? AND coin = ?', { left, cid(P), coin.id })
    end
    MySQL.insert.await('INSERT INTO phone_crypto (citizenid, coin, amount) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE amount = amount + VALUES(amount)', { cid(T), coin.id, units })
    TriggerClientEvent('codera-phone:client:notify', T.PlayerData.source, {
        app = 'crypto', title = 'Crypto',
        text = ('You received %.4f %s from %s'):format(units, coin.symbol, nameOf(P)),
    })
    return { ok = true, state = cryptoState(P) }
end)

local function setVoice(src, channel)
    pcall(function() exports[Config.VoiceResource]:setPlayerCall(src, channel) end)
end

local function logCall(player, number, direction, status, duration)
    if not player then return end
    MySQL.insert('INSERT INTO phone_calls (citizenid, number, direction, status, duration) VALUES (?, ?, ?, ?, ?)',
        { player.PlayerData.citizenid, number, direction, status, duration })
end

local function endCall(id, reason)
    local c = Calls[id]
    if not c then return end
    Calls[id] = nil
    InCall[c.caller], InCall[c.callee] = nil, nil
    local duration = c.answered and (os.time() - c.answered) or 0
    if c.state == 'active' then
        setVoice(c.caller, 0)
        setVoice(c.callee, 0)
    end
    local caller = QBCore.Functions.GetPlayer(c.caller)
    local callee = QBCore.Functions.GetPlayer(c.callee)
    logCall(caller, c.calleeNumber, 'out', c.state == 'active' and 'answered' or 'no answer', duration)
    logCall(callee, c.callerNumber, 'in', c.state == 'active' and 'answered' or 'missed', duration)
    TriggerClientEvent('codera-phone:client:callEnded', c.caller, reason)
    TriggerClientEvent('codera-phone:client:callEnded', c.callee, reason)
end

CB('call:start', function(src, P, d)
    local number = cleanNumber(d.number)
    if number == '' then return { ok = false, err = 'invalid' } end
    if Airplane[src] then return { ok = false, err = 'airplane' } end
    if number == phoneOf(P) then return { ok = false, err = 'self' } end
    if InCall[src] then return { ok = false, err = 'busy' } end
    local T = findByPhone(number)
    if not T or Airplane[T.PlayerData.source] then return { ok = false, err = 'unavailable' } end
    local tsrc = T.PlayerData.source
    if Blocked[tsrc] and Blocked[tsrc][phoneOf(P)] then return { ok = false, err = 'unavailable' } end
    if InCall[tsrc] then return { ok = false, err = 'busy' } end

    CallCounter = CallCounter + 1
    local id = CallCounter
    Calls[id] = {
        id = id, caller = src, callee = tsrc,
        callerNumber = phoneOf(P), calleeNumber = number, state = 'ringing',
    }
    InCall[src], InCall[tsrc] = id, id
    TriggerClientEvent('codera-phone:client:incomingCall', tsrc, { id = id, number = phoneOf(P) })

    SetTimeout(Config.RingTimeout * 1000, function()
        local c = Calls[id]
        if c and c.state == 'ringing' then endCall(id, 'missed') end
    end)
    return { ok = true, id = id }
end)

RegisterNetEvent('codera-phone:server:answer', function()
    local src = source
    local id = InCall[src]
    local c = id and Calls[id]
    if not c or c.callee ~= src or c.state ~= 'ringing' then return end
    c.state, c.answered = 'active', os.time()
    setVoice(c.caller, id)
    setVoice(c.callee, id)
    TriggerClientEvent('codera-phone:client:callAnswered', c.caller, id)
    TriggerClientEvent('codera-phone:client:callAnswered', c.callee, id)
end)

RegisterNetEvent('codera-phone:server:hold', function()
    local src = source
    local id = InCall[src]
    local c = id and Calls[id]
    if not c or c.state ~= 'active' then return end
    c.hold = not c.hold
    local channel = c.hold and 0 or id
    setVoice(c.caller, channel)
    setVoice(c.callee, channel)
    TriggerClientEvent('codera-phone:client:callHold', c.caller, c.hold)
    TriggerClientEvent('codera-phone:client:callHold', c.callee, c.hold)
end)

RegisterNetEvent('codera-phone:server:hangup', function()
    local id = InCall[source]
    if id then endCall(id, 'hangup') end
end)

AddEventHandler('playerDropped', function()
    local src = source
    local id = InCall[src]
    if id then endCall(id, 'hangup') end
    Airplane[src] = nil
    Hidden[src] = nil
    Blocked[src] = nil
end)

QBCore.Functions.CreateUseableItem(Config.PhoneItem, function(src)
    TriggerClientEvent('codera-phone:client:open', src)
end)

exports('SendPhoneNotification', function(src, title, text, app)
    TriggerClientEvent('codera-phone:client:notify', src, { title = title, text = text, app = app or 'settings' })
end)
