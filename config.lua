Config = {}

-- General ---------------------------------------------------------------
Config.OpenKey        = 'M'          -- default key (players can rebind in FiveM settings)
Config.RequireItem    = true         -- must own the phone item to open it
Config.PhoneItem      = 'phone'
Config.Currency       = '$'
Config.UseRealTime    = false        -- false = in-game clock, true = real PC clock
Config.VoiceResource  = 'pma-voice'  -- used for phone calls (setPlayerCall export)
Config.RingTimeout    = 25           -- seconds before an unanswered call is missed
Config.MaxMarketPosts = 60
Config.MaxSocialPosts = 60
-- Called when the player toggles Loudspeaker during a call (client side). pma-voice has no standard
-- export for this, so plug in your own logic here if you want nearby players to hear the call.
Config.OnLoudspeaker = nil -- function(enabled) end
Config.ShareDistance  = 8.0         -- meters: players within this range show up in "Share My Contact"

-- Business app: how many businesses one player can own
Config.MaxBusinesses = 3

-- Phone emote / prop (ported from prp-phone) ---------------------------
Config.PhoneProp         = 'prop_codera_phone_fold_black'      -- CLOSED (folded) phone model. Falls back to prop_npc_phone_02 if the custom models are not streamed
Config.PhonePropOpen     = 'prop_codera_phone_fold_black_open' -- OPEN (unfolded) phone model, shown while the UI is unfolded (T)
Config.PhonePropBone     = 28422                          -- ped bone (28422 = right hand, 60309 = left hand). The stock GTA phone clips hold the phone in the RIGHT hand.
Config.PhonePropOffset   = vector3(0.0, 0.0, 0.0)           -- position offset from the bone (stock phone only)
Config.PhonePropRotation = vector3(0.0, 0.0, 0.0)           -- rotation offset in degrees (stock phone only)
-- Hand settings used ONLY for the custom Codera phone (both models share them).
-- Tune in game with /phoneattach, then paste the printed values here.
Config.PhoneCustomAttach = {
    default = { bone = 28422, offset = vector3(0.0, 0.0, 0.0), rot = vector3(0.0, 0.0, 0.0) },
    -- texting = { bone = 28422, offset = vector3(0.0, 0.0, 0.0), rot = vector3(0.0, 0.0, 0.0) },
}
-- Per-state hand settings (optional). States: open, texting, call. Missing = the values above are used.
-- The texting clip holds the phone differently from the cellphone@ clips, tune it in game with /phoneattach.
Config.PhoneAttach = {
    -- texting = { bone = 28422, offset = vector3(0.0, 0.0, 0.0), rot = vector3(0.0, 0.0, 0.0) },
}
Config.PhoneCustomAnimDict = 'prp@cellphone@'             -- optional custom clip set (stream asset). Used for the "back to home" pose if it exists, otherwise the stock 'cellphone@' dict is used.

-- Camera / Gallery (needs screenshot-basic) -----------------------------
-- Create a Discord webhook and paste the URL here. Photos are uploaded there
-- and the returned image link is stored in the player's gallery.
Config.ScreenshotWebhook = ''
Config.ScreenshotField   = 'files[]'

-- News app: jobs allowed to publish articles
Config.NewsJobs = { 'reporter' }

-- Crypto -----------------------------------------------------------------
Config.CryptoUpdateMinutes = 5
Config.Crypto = {
    { id = 'nvc', name = 'CoderaCoin',   symbol = 'CDC', base = 1200 },
    { id = 'lsc', name = 'LS Cash',    symbol = 'LSC', base = 85   },
    { id = 'gtx', name = 'GridX',      symbol = 'GTX', base = 340  },
    { id = 'bln', name = 'BlueNode',   symbol = 'BLN', base = 22   },
}

-- Wallpapers (css backgrounds) ------------------------------------------
Config.Wallpapers = {
    { id = 'facet',  label = 'Facet',  css = "url('wall-facet.svg') center/cover" },
    { id = 'slate',  label = 'Slate',  css = 'linear-gradient(160deg,#30343b 0%,#15171b 100%)' },
    { id = 'aurora', label = 'Aurora', css = 'linear-gradient(160deg,#0f2027 0%,#203a43 50%,#2c5364 100%)' },
    { id = 'dusk',   label = 'Dusk',   css = 'linear-gradient(160deg,#42275a 0%,#734b6d 100%)' },
    { id = 'ember',  label = 'Ember',  css = 'linear-gradient(160deg,#3a1c1c 0%,#8a3a2f 100%)' },
    { id = 'forest', label = 'Forest', css = 'linear-gradient(160deg,#0b3d2e 0%,#1f6f54 100%)' },
    { id = 'ocean',  label = 'Ocean',  css = 'linear-gradient(160deg,#0a2540 0%,#1e5fa8 100%)' },
    { id = 'neon',   label = 'Neon',   css = 'linear-gradient(160deg,#1b0f3a 0%,#6a1b9a 55%,#e91e63 100%)' },
}
