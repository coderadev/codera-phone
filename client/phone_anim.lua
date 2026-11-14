local activeStates = {}
local appliedState = 'none'
local statePriority = { none = 0, open = 1, texting = 2, call = 3 }

local TEXTING_DICT, TEXTING_NAME = 'amb@world_human_stand_mobile@male@text@base', 'base'
local CAR_DICT  = 'anim@cellphone@in_car@ps'
local FOOT_DICT = 'cellphone@'

local function loadAnimDict(dict)
    if HasAnimDictLoaded(dict) then return true end
    if not DoesAnimDictExist(dict) then return false end
    RequestAnimDict(dict)
    local t = GetGameTimer() + 3000
    while not HasAnimDictLoaded(dict) and GetGameTimer() < t do Wait(0) end
    return HasAnimDictLoaded(dict)
end

local function inVehicle()
    return IsPedInAnyVehicle(PlayerPedId(), false)
end

local function returnAnim()
    local custom = Config.PhoneCustomAnimDict
    if custom and DoesAnimDictExist(custom) then
        return custom, 'cellphone_text_in'
    end
    return FOOT_DICT, 'cellphone_text_in'
end

local phonePropHandle = nil
local phoneUnfolded = false
local customParts = nil

local liveAttach = nil

local function getAttach(state)
    if liveAttach then return liveAttach end
    local src = customParts and Config.PhoneCustomAttach or Config.PhoneAttach
    local per = src and (src[state] or src.default)
    if customParts and not per then
        per = { bone = Config.PhonePropBone }
    end
    return {
        bone = (per and per.bone) or Config.PhonePropBone or 28422,
        offset = (per and per.offset) or (not customParts and Config.PhonePropOffset) or vector3(0.0, 0.0, 0.0),
        rot = (per and per.rot) or (not customParts and Config.PhonePropRotation) or vector3(0.0, 0.0, 0.0),
    }
end

local function attachOne(obj, ped, a)
    SetEntityCollision(obj, false, false)
    AttachEntityToEntity(
        obj, ped, GetPedBoneIndex(ped, a.bone),
        a.offset.x, a.offset.y, a.offset.z,
        a.rot.x, a.rot.y, a.rot.z,
        true, true, false, true, 1, true
    )
    return IsEntityAttachedToEntity(obj, ped)
end

function attachPhoneProp(obj, state)
    if not obj or not DoesEntityExist(obj) then return false end
    local a = getAttach(state)
    local ped = PlayerPedId()
    local ok = attachOne(obj, ped, a)

    if customParts and customParts.open and DoesEntityExist(customParts.open) then
        attachOne(customParts.open, ped, a)
    end
    return ok
end

local function loadModelHash(hash)
    if not IsModelInCdimage(hash) then return false end
    RequestModel(hash)
    local t = GetGameTimer() + 3000
    while not HasModelLoaded(hash) and GetGameTimer() < t do Wait(0) end
    return HasModelLoaded(hash)
end

local function customModelsAvailable()
    if not Config.PhoneProp or not Config.PhonePropOpen then return false end
    return IsModelInCdimage(joaat(Config.PhoneProp))
        and IsModelInCdimage(joaat(Config.PhonePropOpen))
end

local function applyFold(unfolded)
    if not customParts or not phonePropHandle then return end
    if DoesEntityExist(phonePropHandle) then
        SetEntityVisible(phonePropHandle, not unfolded, false)
    end
    if DoesEntityExist(customParts.open) then
        SetEntityVisible(customParts.open, unfolded and true or false, false)
    end
end

local function createPhoneProp()
    if phonePropHandle and DoesEntityExist(phonePropHandle) then
        return phonePropHandle
    end

    local custom = customModelsAvailable()
    local model = joaat(custom and Config.PhoneProp or 'prop_npc_phone_02')
    loadModelHash(model)

    local ped = PlayerPedId()
    local pc = GetEntityCoords(ped)

    local obj = CreateObject(model, pc.x, pc.y, pc.z + 0.2, true, true, false)
    local tries = 0
    while not DoesEntityExist(obj) and tries < 50 do Wait(0); tries = tries + 1 end
    phonePropHandle = obj
    customParts = nil

    if custom then
        local openHash = joaat(Config.PhonePropOpen)
        if loadModelHash(openHash) then
            local o = CreateObject(openHash, pc.x, pc.y, pc.z + 0.2, true, true, false)
            if DoesEntityExist(o) then
                SetEntityCollision(o, false, false)
                customParts = { open = o }
            end
            SetModelAsNoLongerNeeded(openHash)
        end
    end

    tries = 0
    while tries < 20 and not attachPhoneProp(obj, appliedState) do
        Wait(50); tries = tries + 1
    end
    if tries >= 20 then
        print('[codera-phone] WARNING: phone prop could not be attached to the hand (model ' .. tostring(Config.PhoneProp) .. ')')
    end

    SetModelAsNoLongerNeeded(model)

    applyFold(phoneUnfolded)
    return obj
end

local function deletePhoneObjects(obj, parts)
    if parts then
        for _, e in pairs(parts) do
            if e and DoesEntityExist(e) then DeleteEntity(e) end
        end
    end
    if obj and DoesEntityExist(obj) then DeleteEntity(obj) end
end

local function removePhoneProp()
    local obj, parts = phonePropHandle, customParts
    phonePropHandle, customParts = nil, nil
    deletePhoneObjects(obj, parts)
end

function SetPhoneFolded(open)
    phoneUnfolded = open and true or false
    applyFold(phoneUnfolded)
end

AddEventHandler('onResourceStop', function(res)
    if res ~= GetCurrentResourceName() then return end
    deletePhoneObjects(phonePropHandle, customParts)
    phonePropHandle, customParts = nil, nil
end)

local currentAnim = { dict = nil, name = nil, speed = nil, flag = nil }
local loopRunning = false

local function isDeadNow()
    if IsEntityDead(PlayerPedId()) then return true end
    if LocalPlayer.state.isDead or LocalPlayer.state.deathState then return true end
    local ok, pd = pcall(function() return exports['qb-core']:GetCoreObject().Functions.GetPlayerData() end)
    local meta = ok and pd and pd.metadata
    return (meta and (meta['isdead'] or meta['inlaststand'])) and true or false
end

local function startAnimLoop()
    if loopRunning then return end
    loopRunning = true

    CreateThread(function()
        while currentAnim.dict and currentAnim.name do
            if isDeadNow() then
                ResetPhoneAnim()
                if CoderaPhoneOnDeath then CoderaPhoneOnDeath() end
                break
            end

            local ped = PlayerPedId()
            if not IsEntityPlayingAnim(ped, currentAnim.dict, currentAnim.name, 3) then
                TaskPlayAnim(ped, currentAnim.dict, currentAnim.name,
                    currentAnim.speed or 8.0, -1.0, -1, currentAnim.flag or 50, 0.0, false, false, false)
            end
            Wait(1000)
        end
        loopRunning = false
    end)
end

local function playPhoneAnim(dict, name, speed, flag)
    if not loadAnimDict(dict) then return end
    TaskPlayAnim(PlayerPedId(), dict, name, speed or 8.0, -1.0, -1, flag or 50, 0.0, false, false, false)
    currentAnim.dict, currentAnim.name, currentAnim.speed, currentAnim.flag = dict, name, speed, flag
    startAnimLoop()
end

local function stopPhoneAnimTask(dict, name)
    StopAnimTask(PlayerPedId(), dict, name, 1.0)
    currentAnim.dict, currentAnim.name, currentAnim.speed, currentAnim.flag = nil, nil, nil, nil
end

function ResetPhoneAnim()
    if currentAnim.dict and currentAnim.name then
        StopAnimTask(PlayerPedId(), currentAnim.dict, currentAnim.name, 1.0)
    end
    currentAnim.dict, currentAnim.name, currentAnim.speed, currentAnim.flag = nil, nil, nil, nil
    for k in pairs(activeStates) do activeStates[k] = nil end
    appliedState = 'none'
    removePhoneProp()
end

local function getActivePriorityState()
    local maxPriority, activeState = 0, 'none'
    for state, active in pairs(activeStates) do
        local priority = statePriority[state]
        if active and priority and maxPriority < priority then
            maxPriority = priority
            activeState = state
        end
    end
    return activeState
end

local function callAnimNames()
    if inVehicle() then return CAR_DICT, 'cellphone_call_listen_base' end
    return FOOT_DICT, 'cellphone_call_listen_base'
end

local function transitionPhoneState(prev, curr)
    if curr == 'none' then
        removePhoneProp()
    else
        local obj = createPhoneProp()
        attachPhoneProp(obj, curr)
    end

    if prev == 'none' and curr == 'open' then

        if inVehicle() then
            playPhoneAnim(CAR_DICT, 'cellphone_text_in', 7.0, 50)
        else
            playPhoneAnim(FOOT_DICT, 'cellphone_text_in', 7.0, 50)
        end

    elseif (prev == 'none' or prev == 'open') and curr == 'call' then
        local dict, name = callAnimNames()
        playPhoneAnim(dict, name, 3.0, 50)

    elseif prev == 'open' and curr == 'texting' then

        if inVehicle() then
            stopPhoneAnimTask(CAR_DICT, 'cellphone_text_in')
            stopPhoneAnimTask(CAR_DICT, 'cellphone_call_to_text')
        else
            stopPhoneAnimTask(FOOT_DICT, 'cellphone_text_in')
        end
        Wait(100)
        playPhoneAnim(TEXTING_DICT, TEXTING_NAME, 4.0, 50)

    elseif prev == 'call' and curr == 'open' then
        local dict, name = callAnimNames()
        stopPhoneAnimTask(dict, name)
        Wait(200)
        local rd, rn = returnAnim()
        playPhoneAnim(rd, rn, 7.0, 50)

    elseif prev == 'texting' and curr == 'open' then
        stopPhoneAnimTask(TEXTING_DICT, TEXTING_NAME)
        Wait(200)
        local rd, rn = returnAnim()
        playPhoneAnim(rd, rn, 7.0, 50)

    elseif prev == 'texting' and curr == 'call' then
        stopPhoneAnimTask(TEXTING_DICT, TEXTING_NAME)
        Wait(100)
        local dict, name = callAnimNames()
        playPhoneAnim(dict, name, 3.0, 50)

    elseif prev == 'call' and curr == 'texting' then
        local dict, name = callAnimNames()
        stopPhoneAnimTask(dict, name)
        Wait(100)
        playPhoneAnim(TEXTING_DICT, TEXTING_NAME, 4.0, 50)

    elseif prev == 'open' and curr == 'none' then

        if inVehicle() then
            stopPhoneAnimTask(CAR_DICT, 'cellphone_text_in')
            stopPhoneAnimTask(CAR_DICT, 'cellphone_call_to_text')
            local rd, rn = returnAnim()
            stopPhoneAnimTask(rd, rn)
        else
            stopPhoneAnimTask(FOOT_DICT, 'cellphone_text_in')
            Wait(100)
            playPhoneAnim(FOOT_DICT, 'cellphone_text_in', 7.0, 50)
            Wait(200)
            stopPhoneAnimTask(FOOT_DICT, 'cellphone_text_in')
        end

    elseif prev == 'none' and curr == 'texting' then
        playPhoneAnim(TEXTING_DICT, TEXTING_NAME, 4.0, 50)

    elseif prev == 'call' and curr == 'none' then
        local dict, name = callAnimNames()
        stopPhoneAnimTask(dict, name)

    elseif prev == 'texting' and curr == 'none' then
        stopPhoneAnimTask(TEXTING_DICT, TEXTING_NAME)
    end
end

local isTransitioning = false

local function queueTransition()
    if isTransitioning then return end
    isTransitioning = true
    CreateThread(function()
        while true do
            local target = getActivePriorityState()
            if target == appliedState then break end
            local prev = appliedState
            appliedState = target
            transitionPhoneState(prev, target)
        end
        isTransitioning = false
    end)
end

function SetPhoneStates(changes)
    for state, active in pairs(changes) do
        activeStates[state] = active and true or nil
    end
    if getActivePriorityState() == appliedState then return end
    queueTransition()
end

function SetPhoneState(state, active)
    SetPhoneStates({ [state] = active })
end

RegisterCommand('phoneattach', function(_, args)
    if args[1] == 'reset' then
        liveAttach = nil
    else
        local n = {}
        for i = 1, 7 do n[i] = tonumber(args[i]) end
        if not n[1] or not n[2] or not n[3] then
            print('[codera-phone] usage: /phoneattach x y z rx ry rz [bone]')
            return
        end
        liveAttach = {
            bone = n[7] or Config.PhonePropBone or 28422,
            offset = vector3(n[1], n[2], n[3] or 0.0),
            rot = vector3(n[4] or 0.0, n[5] or 0.0, n[6] or 0.0),
        }
        print(('[codera-phone] Config.PhoneAttach.%s = { bone = %d, offset = vector3(%.3f, %.3f, %.3f), rot = vector3(%.1f, %.1f, %.1f) }')
            :format(appliedState, liveAttach.bone, n[1], n[2], n[3], n[4] or 0.0, n[5] or 0.0, n[6] or 0.0))
    end
    attachPhoneProp(phonePropHandle, appliedState)
end, false)
