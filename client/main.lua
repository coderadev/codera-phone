local QBCore = exports['qb-core']:GetCoreObject()

local isOpen, inCamera, inCall, ringing = false, false, false, false
local dnd, airplane = false, false

local function getZone()
    local c = GetEntityCoords(PlayerPedId())
    local zone = GetLabelText(GetNameOfZone(c.x, c.y, c.z))
    local street = GetStreetNameFromHashKey((GetStreetNameAtCoord(c.x, c.y, c.z)))
    return zone, street
end

local function sendTick()
    local zone, street = getZone()
    SendNUIMessage({ action = 'tick', h = GetClockHours(), m = GetClockMinutes(), zone = zone, street = street })
end

local function uiConfig()
    return {
        wallpapers = Config.Wallpapers,
        currency = Config.Currency,
        realTime = Config.UseRealTime,
    }
end

local function closePhone()
    if not isOpen then return end
    isOpen = false
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'close' })

    SetPhoneStates({ texting = false, open = false })
end

function CoderaPhoneOnDeath()
    if isOpen then
        isOpen = false
        SetNuiFocus(false, false)
        SendNUIMessage({ action = 'close' })
    end
end

local function openPhone()
    if isOpen or inCamera then return end
    local pd = QBCore.Functions.GetPlayerData()
    if not pd or not pd.citizenid then return end
    if pd.metadata and (pd.metadata['isdead'] or pd.metadata['inlaststand'] or pd.metadata['ishandcuffed']) then return end
    if IsPauseMenuActive() then return end

    QBCore.Functions.TriggerCallback('codera-phone:getAll', function(data)
        if not data then
            QBCore.Functions.Notify('Phone failed to load. Check the server console for [codera-phone] errors (usually missing SQL tables).', 'error', 8000)
            return
        end
        if data.noPhone then
            QBCore.Functions.Notify('You do not have a phone', 'error')
            return
        end
        if isOpen or inCamera then return end
        isOpen = true
        dnd = data.settings and data.settings.dnd or false
        airplane = data.settings and data.settings.airplane or false
        SetNuiFocus(true, true)
        local zone, street = getZone()
        SendNUIMessage({
            action = 'open', data = data, cfg = uiConfig(),
            h = GetClockHours(), m = GetClockMinutes(), zone = zone, street = street,
        })
        SetPhoneState('open', true)
        CreateThread(function()
            while isOpen do
                sendTick()
                Wait(2000)
            end
        end)
    end)
end

RegisterCommand('coderaphone', function()
    if isOpen then closePhone() else openPhone() end
end, false)
RegisterKeyMapping('coderaphone', 'Open phone', 'keyboard', Config.OpenKey)

RegisterCommand('phone', function()
    if isOpen then closePhone() else openPhone() end
end, false)

AddEventHandler('onClientResourceStart', function(res)
    if res ~= GetCurrentResourceName() then return end
    print(('[codera-phone] client started. Key: %s | require item: %s (%s)'):format(Config.OpenKey, tostring(Config.RequireItem), Config.PhoneItem))
end)

RegisterNetEvent('codera-phone:client:open', openPhone)

RegisterNUICallback('close', function(_, cb)
    cb({})
    closePhone()
end)

RegisterNUICallback('fold', function(data, cb)
    cb({})
    SetPhoneFolded(data and data.open)
end)

RegisterNUICallback('inputFocus', function(data, cb)
    cb({})
    if not isOpen then return end
    SetPhoneState('texting', data and data.focused and true or false)
end)

RegisterNUICallback('cb', function(data, cb)
    if type(data) ~= 'table' or type(data.name) ~= 'string' then return cb({}) end
    QBCore.Functions.TriggerCallback('codera-phone:' .. data.name, function(res)
        cb(res == nil and {} or res)
    end, data.payload or {})
end)

RegisterNUICallback('sync', function(data, cb)
    dnd = data and data.dnd and true or false
    airplane = data and data.airplane and true or false
    cb({})
end)

RegisterNUICallback('answer', function(_, cb)
    cb({})
    ringing = false
    TriggerServerEvent('codera-phone:server:answer')
end)

RegisterNUICallback('callhold', function(_, cb)
    cb({})
    TriggerServerEvent('codera-phone:server:hold')
end)

RegisterNUICallback('callopt', function(d, cb)
    cb({})
    if d and d.kind == 'mute' then
        pcall(NetworkSetVoiceActive, not d.on)
    elseif d and d.kind == 'speaker' and Config.OnLoudspeaker then
        pcall(Config.OnLoudspeaker, d.on and true or false)
    end
end)

RegisterNUICallback('hangup', function(_, cb)
    cb({})
    ringing = false
    TriggerServerEvent('codera-phone:server:hangup')
end)

local function takePhoto()
    if Config.ScreenshotWebhook == '' then
        QBCore.Functions.Notify('Camera is not configured (missing webhook)', 'error')
        return
    end
    PlaySoundFrontend(-1, 'Camera_Shoot', 'Phone_SoundSet_Default', true)
    local ok = pcall(function()
        exports['screenshot-basic']:requestScreenshotUpload(Config.ScreenshotWebhook, Config.ScreenshotField, function(res)
            local decoded = json.decode(res or '{}') or {}
            local url = decoded.attachments and decoded.attachments[1] and decoded.attachments[1].url
            if url then
                TriggerServerEvent('codera-phone:server:addPhoto', url)
                QBCore.Functions.Notify('Photo saved to gallery', 'success')
            else
                QBCore.Functions.Notify('Photo upload failed', 'error')
            end
        end)
    end)
    if not ok then QBCore.Functions.Notify('screenshot-basic is not running', 'error') end
end

local function startCamera()
    if inCamera then return end
    inCamera = true
    closePhone()
    local selfie = false
    DestroyMobilePhone()
    CreateMobilePhone(0)
    CellCamActivate(true, true)
    DisplayRadar(false)
    CreateThread(function()
        while inCamera do
            HideHudComponentThisFrame(7)
            HideHudComponentThisFrame(8)
            HideHudComponentThisFrame(9)
            HideHudComponentThisFrame(6)
            HideHudComponentThisFrame(19)
            if IsControlJustPressed(0, 177) then
                inCamera = false
            elseif IsControlJustPressed(0, 191) then
                takePhoto()
            elseif IsControlJustPressed(0, 172) then
                selfie = not selfie
                CellCamActivateSelfieMode(selfie)
            end
            Wait(0)
        end
        CellCamActivate(false, false)
        DestroyMobilePhone()
        DisplayRadar(true)
        Wait(150)
        openPhone()
    end)
end

RegisterNUICallback('camera', function(_, cb)
    cb({})
    startCamera()
end)

RegisterNetEvent('codera-phone:client:photoSaved', function(gallery)
    SendNUIMessage({ action = 'gallery', gallery = gallery })
end)

RegisterNetEvent('codera-phone:client:newMessage', function(msg)
    SendNUIMessage({ action = 'newMessage', msg = msg })
    if not dnd then
        PlaySoundFrontend(-1, 'Text_Arrive_Tone', 'Phone_SoundSet_Default', true)
    end
end)

RegisterNetEvent('codera-phone:client:notify', function(n)
    SendNUIMessage({ action = 'notify', notif = n })
    if not dnd then
        PlaySoundFrontend(-1, 'Text_Arrive_Tone', 'Phone_SoundSet_Default', true)
    end
end)

RegisterNetEvent('codera-phone:client:groups', function(groups)
    SendNUIMessage({ action = 'groups', groups = groups })
end)

RegisterNUICallback('coords', function(_, cb)
    local c = GetEntityCoords(PlayerPedId())
    cb({ loc = ('%.2f,%.2f'):format(c.x, c.y) })
end)

RegisterNUICallback('waypoint', function(d, cb)
    cb({})
    local x, y = tostring(d and d.loc or ''):match('^(%-?%d+%.?%d*),(%-?%d+%.?%d*)$')
    if x then
        SetNewWaypoint(tonumber(x) + 0.0, tonumber(y) + 0.0)
        QBCore.Functions.Notify('Waypoint set', 'success')
    end
end)

RegisterNetEvent('codera-phone:client:shared', function(shared, from)
    SendNUIMessage({ action = 'shared', shared = shared, from = from })
    if not dnd then
        PlaySoundFrontend(-1, 'Text_Arrive_Tone', 'Phone_SoundSet_Default', true)
    end
end)

RegisterNetEvent('codera-phone:client:incomingCall', function(d)
    sendTick()
    SendNUIMessage({ action = 'incomingCall', id = d.id, number = d.number })
    if dnd or airplane then return end
    ringing = true
    CreateThread(function()
        while ringing do
            PlaySoundFrontend(-1, 'Remote_Ring', 'Phone_SoundSet_Michael', true)
            local untilT = GetGameTimer() + 3000
            while ringing and GetGameTimer() < untilT do
                if not isOpen then
                    if IsControlJustPressed(0, 246) or IsControlJustPressed(0, 191) then
                        ringing = false
                        TriggerServerEvent('codera-phone:server:answer')
                    elseif IsControlJustPressed(0, 306) or IsControlJustPressed(0, 177) then
                        ringing = false
                        TriggerServerEvent('codera-phone:server:hangup')
                    end
                end
                Wait(0)
            end
        end
    end)
end)

RegisterNetEvent('codera-phone:client:callAnswered', function(id)
    ringing = false
    inCall = true
    SendNUIMessage({ action = 'callAnswered', id = id })
    SetPhoneState('call', true)
end)

RegisterNetEvent('codera-phone:client:callHold', function(on)
    SendNUIMessage({ action = 'callHold', on = on })
end)

RegisterNetEvent('codera-phone:client:callEnded', function(reason)
    ringing = false
    inCall = false
    pcall(NetworkSetVoiceActive, true)
    SendNUIMessage({ action = 'callEnded', reason = reason })
    SetPhoneState('call', false)
end)

AddEventHandler('onResourceStop', function(res)
    if res ~= GetCurrentResourceName() then return end
    SetNuiFocus(false, false)
    ResetPhoneAnim()
    if inCamera then
        CellCamActivate(false, false)
        DestroyMobilePhone()
        DisplayRadar(true)
    end
end)

RegisterNetEvent('QBCore:Client:OnPlayerUnload', function()
    if isOpen then closePhone() end
end)

exports('IsPhoneOpen', function() return isOpen end)
