// AUTO-GENERATED from Onimaru.lua BuildDefaultMenu — run: node scripts/extractMockMenu.mjs
import type { MenuEntry } from './types'

export const mockMenuSections: MenuEntry[] = [
  {
    "label": "Self",
    "type": "subMenu",
    "categories": [
      {
        "label": "Player",
        "tabs": [
          {
            "type": "button",
            "label": "Revive",
            "desc": "This will attempt to revive you by script."
          },
          {
            "type": "slider",
            "label": "Health",
            "desc": "This will set your health to the desired amount.",
            "value": 100,
            "min": 0,
            "max": 100,
            "step": 1
          },
          {
            "type": "slider",
            "label": "Armour",
            "desc": "This will set your armour to the desired amount.",
            "value": 100,
            "min": 0,
            "max": 100,
            "step": 1
          },
          {
            "type": "button",
            "label": "Refill Health",
            "desc": "This will refill your health to the maximum value."
          },
          {
            "type": "button",
            "label": "Refill Armour",
            "desc": "This will refill your armour to the maximum value."
          },
          {
            "type": "checkbox",
            "label": "Godmode",
            "desc": "This will give your player godmode.",
            "checked": false
          },
          {
            "type": "checkbox",
            "label": "Invisibility",
            "desc": "This will make your player invisible.",
            "checked": false
          },
          {
            "type": "divider",
            "label": "Movement"
          },
          {
            "type": "slider-checkbox",
            "label": "Noclip",
            "desc": "This will make your player noclipping.",
            "checked": false,
            "value": 0.25,
            "min": 0.25,
            "max": 5,
            "step": 0.25
          },
          {
            "type": "slider-checkbox",
            "label": "Freecam",
            "desc": "Freecam destroyer (safe).",
            "checked": false,
            "value": 0.25,
            "min": 0.25,
            "max": 5,
            "step": 0.25
          },
          {
            "type": "checkbox",
            "label": "Fast Run",
            "desc": "This will make your player run faster.",
            "checked": false
          },
          {
            "type": "checkbox",
            "label": "Super Jump",
            "desc": "this will make your player have super power.",
            "checked": false
          },
          {
            "type": "divider",
            "label": "Self Options"
          },
          {
            "type": "checkbox",
            "label": "God Mode",
            "desc": "Makes you invincible - you cannot take damage.",
            "checked": false
          },
          {
            "type": "checkbox",
            "label": "Infinite Ammo",
            "desc": "Never run out of ammo - infinite ammunition.",
            "checked": false
          },
          {
            "type": "checkbox",
            "label": "Super Speed",
            "desc": "Move at super fast speed.",
            "checked": false
          },
          {
            "type": "button",
            "label": "Give All Weapons",
            "desc": "Gives you every weapon in the game."
          }
        ]
      },
      {
        "label": "Miscellaneous",
        "tabs": [
          {
            "type": "button",
            "label": "Clear Screen Effects",
            "desc": "Removes all screen effects"
          },
          {
            "type": "button",
            "label": "Suicide",
            "desc": "This will kill you."
          },
          {
            "type": "button",
            "label": "Force Ragdoll",
            "desc": "This will ragdoll."
          },
          {
            "type": "button",
            "label": "Remove Crutch",
            "desc": "Remove Crutch is the server is using the correct resource"
          },
          {
            "type": "scrollable",
            "label": "Clear Tasks",
            "desc": "Clears the character's tasks",
            "value": 1,
            "values": [
              "Primary",
              "Secondary"
            ]
          },
          {
            "type": "divider",
            "label": "Toggles"
          },
          {
            "type": "checkbox",
            "label": "No Ragdoll",
            "desc": "This will prevent you from being ragdolled from admins or cheaters.",
            "checked": false
          },
          {
            "type": "checkbox",
            "label": "Anti-Freeze",
            "desc": "This will prevent you from being frozen.",
            "checked": false
          },
          {
            "type": "checkbox",
            "label": "Force Third Person",
            "desc": "This will force third person.",
            "checked": false
          },
          {
            "type": "checkbox",
            "label": "Force Driveby",
            "desc": "This will enable driveby if disabled.",
            "checked": false
          },
          {
            "type": "checkbox",
            "label": "Infinite Stamina",
            "desc": "This will enable Infinite Stamina.",
            "checked": false
          },
          {
            "type": "checkbox",
            "label": "Tiny Ped",
            "desc": "This will turn you into a tiny ped.",
            "checked": false
          },
          {
            "type": "checkbox",
            "label": "Super Punch",
            "desc": "This will make john cenna.",
            "checked": false
          },
          {
            "type": "divider",
            "label": "txAdmin Options"
          },
          {
            "type": "checkbox",
            "label": "txAdmin Player IDs",
            "desc": "This will toggle txAdmin Player ids.",
            "checked": false
          },
          {
            "type": "checkbox",
            "label": "txAdmin Noclip",
            "desc": "This will toggle txAdmin noclip"
          },
          {
            "type": "checkbox",
            "label": "Disable All txAdmin",
            "desc": "This will disable txAdmin options from admins using them against you.",
            "checked": false
          },
          {
            "type": "checkbox",
            "label": "Disable txAdmin Teleport",
            "desc": "This will disable txAdmin Teleport.",
            "checked": false
          },
          {
            "type": "checkbox",
            "label": "Disable txAdmin Freeze",
            "desc": "This will disable txAdmin Freeze.",
            "checked": false
          }
        ]
      },
      {
        "label": "Wardrobe",
        "tabs": [
          {
            "type": "scrollable",
            "label": "Outfit",
            "desc": "Apply a preset outfit",
            "value": 1,
            "values": [
              "Random"
            ]
          },
          {
            "type": "divider",
            "label": "Ped Options"
          },
          {
            "type": "scrollable",
            "label": "Freemode",
            "desc": "Apply a ped model",
            "value": 1,
            "values": [
              "Freemode Male",
              "Freemode Female"
            ]
          },
          {
            "type": "scrollable",
            "label": "Peds",
            "desc": "Apply a native ped",
            "value": 1,
            "values": [
              "Michael",
              "Franklin",
              "Trevor",
              "Lamar",
              "Jimmy",
              "Amanda",
              "Tracey",
              "Ron",
              "Wade",
              "Dave Norton",
              "Steve Haines",
              "Devin Weston",
              "Floyd",
              "Chef",
              "Lester",
              "Chop",
              "Brad",
              "Police Officer Male",
              "Police Officer Female",
              "SWAT",
              "Sheriff Male",
              "Sheriff Female",
              "Highway Cop",
              "FIB Male",
              "FIB Female",
              "Paramedic",
              "Firefighter",
              "Doctor",
              "Construction Worker",
              "Pilot Male",
              "Pilot Female",
              "Business Male",
              "Business Female",
              "Street Dealer",
              "Gang Male 1",
              "Gang Male 2",
              "Gang Female 1",
              "Ballas 1",
              "Ballas 2",
              "Ballas Female",
              "Families 1",
              "Families 2",
              "Vagos 1",
              "Vagos 2",
              "Lost MC 1",
              "Lost MC 2",
              "Lost MC Female",
              "Army Soldier",
              "Marine 1",
              "Marine 2",
              "Prisoner Male",
              "Prison Guard",
              "Cop Undercover",
              "Security Guard",
              "Janitor",
              "Hobo Male",
              "Hobo Female",
              "Prostitute 1",
              "Prostitute 2",
              "Beach Male",
              "Beach Female",
              "Tourist Male",
              "Tourist Female",
              "Skater",
              "Hipster Male",
              "Hipster Female",
              "Bouncer",
              "Shopkeeper",
              "Chef",
              "Bartender",
              "Waiter",
              "Mechanic",
              "Taxi Driver",
              "Gardener",
              "Farmer",
              "Dock Worker",
              "Trash Worker",
              "Postal Worker",
              "Bus Driver",
              "Pilot",
              "Air Hostess",
              "Cop Traffic",
              "Cop Detective",
              "Agent",
              "Reporter",
              "News Cameraman",
              "Hunter",
              "Hiker Male",
              "Hiker Female",
              "Golfer Male",
              "Golfer Female",
              "Tennis Player Male",
              "Tennis Player Female"
            ]
          },
          {
            "type": "scrollable",
            "label": "Animal Peds",
            "desc": "Apply a animal ped",
            "value": 1,
            "values": [
              "Boar",
              "Cat",
              "Chicken",
              "Chimp",
              "Cow",
              "Coyote",
              "Crow",
              "Deer",
              "Dolphin",
              "Fish",
              "Hen",
              "Humpback",
              "Husky",
              "Killer Whale",
              "Mountain Lion",
              "Pig",
              "Pigeon",
              "Poodle",
              "Pug",
              "Poodle",
              "Rabbit",
              "Rat",
              "Retriever",
              "Rhesus Monkey",
              "Rottweiler",
              "Seagull",
              "Shepherd",
              "Stingray",
              "Tiger Shark",
              "Hammerhead Shark",
              "Cow",
              "Cat2",
              "Chickenhawk",
              "Cormorant",
              "Coyote2",
              "Chimp2",
              "Boar2",
              "Deer2",
              "Fish2",
              "Husky2",
              "Pug2",
              "Poodle2",
              "Retriever2",
              "Shepherd2",
              "Rat2",
              "Rabbit2",
              "Dolphin2",
              "Killer Whale2",
              "Mountain Lion2",
              "Pig2",
              "Seagull2",
              "Stingray2",
              "Tiger Shark2",
              "Hammerhead Shark2"
            ]
          }
        ]
      },
      {
        "label": "Ped/NPC",
        "tabs": [
          {
            "type": "divider",
            "label": "Ped/NPC"
          },
          {
            "type": "scrollable",
            "label": "Spawn Bodyguards",
            "desc": "Spawn armed NPCs that follow and protect you.",
            "value": 1,
            "values": [
              "1 Bodyguard",
              "2 Bodyguards",
              "3 Bodyguards",
              "5 Bodyguards"
            ]
          },
          {
            "type": "scrollable",
            "label": "Spawn Hostile NPCs",
            "desc": "Spawn hostile NPCs at player location (attacks nearby).",
            "value": 1,
            "values": [
              "1 Hostile",
              "3 Hostiles",
              "5 Hostiles",
              "10 Hostiles"
            ]
          },
          {
            "type": "scrollable",
            "label": "Spawn Animals",
            "desc": "Spawn various animals at your location.",
            "value": 1,
            "values": [
              "Dog (Husky)",
              "Dog (Rottweiler)",
              "Dog (Shepherd)",
              "Cat",
              "Mountain Lion",
              "Boar",
              "Deer",
              "Cow",
              "Shark (Tiger)",
              "Shark (Hammerhead)"
            ]
          },
          {
            "type": "scrollable",
            "label": "Spawn Clones",
            "desc": "Spawn multiple clones of yourself.",
            "value": 1,
            "values": [
              "1 Clone",
              "3 Clones",
              "5 Clones",
              "10 Clones"
            ]
          },
          {
            "type": "divider",
            "label": "Management"
          },
          {
            "type": "button",
            "label": "Delete All Spawned NPCs",
            "desc": "Remove all NPCs you've spawned."
          }
        ]
      }
    ]
  },
  {
    "label": "Server",
    "type": "subMenu",
    "categories": [
      {
        "label": "List",
        "tabs": [
          {
            "type": "button",
            "label": "Select Everyone",
            "desc": "this will select everyone on menu"
          },
          {
            "type": "button",
            "label": "Un-Select Everyone",
            "desc": "this will unselect everyone on menu"
          },
          {
            "type": "button",
            "label": "Clear Selection",
            "desc": "this will clear your selects"
          },
          {
            "type": "divider",
            "label": "Nearby Players",
            "desc": "this will select nearby players"
          }
        ]
      },
      {
        "label": "Safe",
        "tabs": [
          {
            "type": "button",
            "label": "Teleport to Player"
          },
          {
            "type": "checkbox",
            "label": "Spectate Player",
            "checked": false
          },
          {
            "type": "button",
            "label": "Copy Appearance"
          },
          {
            "type": "button",
            "label": "Launch Player"
          },
          {
            "type": "divider",
            "label": "Navigation"
          },
          {
            "type": "button",
            "label": "Waypoint to Player"
          },
          {
            "type": "checkbox",
            "label": "Track Player (Blip)",
            "checked": false
          },
          {
            "type": "button",
            "label": "Show Distance"
          },
          {
            "type": "divider",
            "label": "Player Info"
          },
          {
            "type": "button",
            "label": "Copy Server ID"
          },
          {
            "type": "button",
            "label": "Copy Player Name"
          },
          {
            "type": "button",
            "label": "Player Info Panel"
          },
          {
            "type": "button",
            "label": "Copy Vehicle"
          },
          {
            "type": "button",
            "label": "Copy Outfit"
          },
          {
            "type": "button",
            "label": "Clone Player (NPC)"
          }
        ]
      },
      {
        "label": "Trolling",
        "tabs": [
          {
            "type": "button",
            "label": "Crash Nearby",
            "desc": "Crashes Nearby Players."
          },
          {
            "type": "button",
            "label": "Crash Nearby BETA",
            "desc": "Crashes Nearby Players."
          },
          {
            "type": "button",
            "label": "Cage Player"
          },
          {
            "type": "button",
            "label": "Set on Fire"
          },
          {
            "type": "button",
            "label": "Ram with Vehicle",
            "desc": "Send vehicle towards player"
          },
          {
            "type": "button",
            "label": "Explode Vehicle Only"
          },
          {
            "type": "button",
            "label": "Rain Money"
          },
          {
            "type": "button",
            "label": "Attach Cone"
          },
          {
            "type": "button",
            "label": "Attach Christmas Tree"
          },
          {
            "type": "button",
            "label": "Attach Toilet"
          },
          {
            "type": "button",
            "label": "Spawn UFO Above"
          },
          {
            "type": "button",
            "label": "Strike Lightning"
          }
        ]
      },
      {
        "label": "Risky",
        "tabs": [
          {
            "type": "button",
            "label": "Explode Player"
          },
          {
            "type": "button",
            "label": "Ban Players"
          },
          {
            "type": "divider",
            "label": "Ped Options"
          },
          {
            "type": "button",
            "label": "Clone Player"
          },
          {
            "type": "button",
            "label": "Attack Clone Player"
          },
          {
            "type": "divider",
            "label": "Vehicle Options"
          },
          {
            "type": "scrollable",
            "label": "Attach Vehicle",
            "value": 1,
            "values": [
              "bmx",
              "sanchez",
              "adder",
              "blista",
              "sultan",
              "faggio",
              "bati",
              "pcj",
              "oppressor",
              "maverick",
              "buzzard",
              "cargobob",
              "t20",
              "comet",
              "kuruma",
              "zentorno",
              "entityxf",
              "carbonizzare",
              "elegy",
              "massacro",
              "vagner",
              "nightshark",
              "banshee",
              "feltzer2",
              "ruston",
              "bullet",
              "elegy2"
            ]
          },
          {
            "type": "divider",
            "label": "Object Options"
          },
          {
            "type": "scrollable",
            "label": "Attach",
            "value": 1,
            "values": [
              "bmx",
              "sanchez",
              "adder",
              "blista",
              "sultan",
              "faggio",
              "bati",
              "pcj",
              "oppressor",
              "maverick",
              "buzzard",
              "cargobob",
              "t20",
              "comet",
              "zentorno",
              "tampa",
              "nightshark",
              "kuruma",
              "buffalo",
              "massacro",
              "ferrari",
              "comet2",
              "issi2",
              "vindicator",
              "baller",
              "baller2"
            ]
          },
          {
            "type": "scrollable",
            "label": "Attach Prop",
            "value": 1,
            "values": [
              "prop_barrel_02a",
              "prop_cone_float_1",
              "prop_chair_01a",
              "prop_boombox_01",
              "prop_tool_broom",
              "prop_golf_ball",
              "prop_laptop_01a",
              "prop_trafficcone_01a",
              "prop_pizza_box_01",
              "prop_mb_cargo_01a",
              "prop_ld_crate_01a",
              "prop_ld_fueldoor",
              "prop_ld_greenscreen_01",
              "prop_ld_shovel",
              "prop_snow_bottle",
              "prop_snow_locker_01",
              "prop_dummy_01",
              "prop_dummy_02"
            ]
          },
          {
            "type": "scrollable",
            "label": "Attach Furniture",
            "value": 1,
            "values": [
              "prop_table_01",
              "prop_table_02",
              "prop_table_03",
              "prop_chair_02",
              "prop_chair_03",
              "prop_chair_04a",
              "prop_sofa_01",
              "prop_sofa_02",
              "prop_sofa_03",
              "prop_bed_01",
              "prop_bed_02",
              "prop_lamp_01",
              "prop_lamp_02",
              "prop_lamp_03",
              "prop_couch_01",
              "prop_couch_02",
              "prop_tv_01",
              "prop_tv_02",
              "prop_tv_03",
              "prop_computer_01",
              "prop_computer_02",
              "prop_monitor_01",
              "prop_monitor_02"
            ]
          },
          {
            "type": "scrollable",
            "label": "Attach Misc",
            "value": 1,
            "values": [
              "prop_beer_bottle",
              "prop_soda_cup",
              "prop_papercup_01",
              "prop_cup_coffee_01",
              "prop_champ_flute",
              "prop_cs_burger_01",
              "prop_cs_burger_02",
              "prop_cs_hotdog_01",
              "prop_cs_pizza_01",
              "prop_cs_sandwich_01",
              "prop_cs_juice_01"
            ]
          }
        ]
      },
      {
        "label": "Vehicle",
        "tabs": [
          {
            "type": "button",
            "label": "Kick From Vehicle"
          },
          {
            "type": "button",
            "label": "Teleport to Ocean"
          }
        ]
      },
      {
        "label": "All",
        "tabs": [
          {
            "type": "checkbox",
            "label": "Server Console Spam",
            "checked": false
          },
          {
            "type": "divider",
            "label": "Lua Exploit"
          },
          {
            "type": "button",
            "label": "Bring All Players"
          },
          {
            "type": "button",
            "label": "Attach Crazy Cars On All"
          },
          {
            "type": "button",
            "label": "Attach Crazy Cars On All V2"
          },
          {
            "type": "button",
            "label": "Rain Ballen"
          },
          {
            "type": "button",
            "label": "Flag On Everyone"
          },
          {
            "type": "divider",
            "label": "QB & ESX"
          },
          {
            "type": "button",
            "label": "Revive (QBCore)"
          },
          {
            "type": "button",
            "label": "Admin Menu (QBCore)"
          },
          {
            "type": "divider",
            "label": "Triggers Explot"
          },
          {
            "type": "button",
            "label": "Jail All (Script Required)"
          },
          {
            "type": "button",
            "label": "Force Twerk (Script Required)"
          },
          {
            "type": "divider",
            "label": "Inventory Exploit"
          },
          {
            "type": "button",
            "label": "VIP Store (OX INV)"
          },
          {
            "type": "button",
            "label": "VIP Store (QB INV)"
          },
          {
            "type": "button",
            "label": "VIP Store (QS INV)"
          },
          {
            "type": "divider",
            "label": "Other"
          }
        ]
      }
    ]
  },
  {
    "label": "Weapon",
    "type": "subMenu",
    "categories": [
      {
        "label": "Spawner",
        "tabs": [
          {
            "type": "button",
            "label": "Give Weapon"
          },
          {
            "type": "button",
            "label": "Give All Weapons"
          },
          {
            "type": "button",
            "label": "Remove All Weapons"
          },
          {
            "type": "divider",
            "label": "All Weapons"
          },
          {
            "type": "scrollable",
            "label": "Melee",
            "value": 1
          },
          {
            "type": "scrollable",
            "label": "Handguns",
            "value": 1
          },
          {
            "type": "scrollable",
            "label": "SMGs",
            "value": 1
          },
          {
            "type": "scrollable",
            "label": "Rifles",
            "value": 1
          },
          {
            "type": "scrollable",
            "label": "Shotguns",
            "value": 1
          },
          {
            "type": "scrollable",
            "label": "Snipers",
            "value": 1
          },
          {
            "type": "scrollable",
            "label": "Explosives",
            "value": 1
          },
          {
            "type": "scrollable",
            "label": "Heavy",
            "value": 1
          },
          {
            "type": "scrollable",
            "label": "Throwables",
            "value": 1
          }
        ]
      },
      {
        "label": "Combat",
        "tabs": [
          {
            "type": "checkbox",
            "label": "Infinite Ammo ",
            "desc": "Infinite Ammo, this might be detected on certain servers",
            "checked": false
          },
          {
            "type": "checkbox",
            "label": "Anti-Headshot",
            "desc": "This will prevent you from being headshot.",
            "checked": false
          }
        ]
      }
    ]
  },
  {
    "label": "Vehicle",
    "type": "subMenu",
    "categories": [
      {
        "label": "Spawner",
        "tabs": [
          {
            "type": "button",
            "label": "Give Weapon"
          },
          {
            "type": "button",
            "label": "Give All Weapons"
          },
          {
            "type": "button",
            "label": "Remove All Weapons"
          },
          {
            "type": "divider",
            "label": "All Weapons"
          },
          {
            "type": "scrollable",
            "label": "Melee",
            "value": 1
          },
          {
            "type": "scrollable",
            "label": "Handguns",
            "value": 1
          },
          {
            "type": "scrollable",
            "label": "SMGs",
            "value": 1
          },
          {
            "type": "scrollable",
            "label": "Rifles",
            "value": 1
          },
          {
            "type": "scrollable",
            "label": "Shotguns",
            "value": 1
          },
          {
            "type": "scrollable",
            "label": "Snipers",
            "value": 1
          },
          {
            "type": "scrollable",
            "label": "Explosives",
            "value": 1
          },
          {
            "type": "scrollable",
            "label": "Heavy",
            "value": 1
          },
          {
            "type": "scrollable",
            "label": "Throwables",
            "value": 1
          }
        ]
      },
      {
        "label": "Combat",
        "tabs": [
          {
            "type": "checkbox",
            "label": "Infinite Ammo ",
            "desc": "Infinite Ammo, this might be detected on certain servers",
            "checked": false
          },
          {
            "type": "checkbox",
            "label": "Anti-Headshot",
            "desc": "This will prevent you from being headshot.",
            "checked": false
          }
        ]
      }
    ]
  },
  {
    "label": "Emotes",
    "type": "subMenu",
    "categories": [
      {
        "label": "Emote Menu",
        "tabs": [
          {
            "type": "button",
            "label": "Detach All Entitys"
          },
          {
            "type": "divider",
            "label": "Emotes"
          },
          {
            "type": "button",
            "label": "Twerk Player"
          },
          {
            "type": "divider",
            "label": "Vehicle Emotes"
          },
          {
            "type": "button",
            "label": "Blow Driver"
          }
        ]
      }
    ]
  },
  {
    "label": "Teleports",
    "type": "subMenu",
    "categories": [
      {
        "label": "Teleport Menu",
        "tabs": [
          {
            "type": "button",
            "label": "FIB Building"
          },
          {
            "type": "button",
            "label": "Mission Row PD"
          },
          {
            "type": "button",
            "label": "Pillbox Hospital"
          },
          {
            "type": "button",
            "label": "Grove Street"
          },
          {
            "type": "button",
            "label": "Legion Square"
          }
        ]
      }
    ]
  },
  {
    "label": "World Spawning",
    "type": "subMenu",
    "categories": [
      {
        "label": "World Objects",
        "tabs": [
          {
            "type": "divider",
            "label": "Luxury Spawns"
          },
          {
            "type": "button",
            "label": "Spawn Yacht",
            "desc": "Spawn a luxury yacht near your location (Everyone Sees)."
          },
          {
            "type": "scrollable",
            "label": "Spawn Boat",
            "desc": "Spawn a boat near your location.",
            "value": 1,
            "values": [
              "Dinghy",
              "Jetmax",
              "Marquis",
              "Speeder",
              "Squalo",
              "Submersible",
              "Toro",
              "Tropic",
              "Tug"
            ]
          },
          {
            "type": "divider",
            "label": "Ramps & Props"
          },
          {
            "type": "scrollable",
            "label": "Spawn Ramp",
            "desc": "Create jump ramps anywhere",
            "value": 1,
            "values": [
              "Small Ramp",
              "Large Ramp",
              "Stunt Ramp",
              "Container Ramp"
            ]
          },
          {
            "type": "scrollable",
            "label": "Spawn Props",
            "desc": "Spawn various props at your location.",
            "value": 1,
            "values": [
              "Barrier",
              "Cone",
              "Dumpster",
              "Container",
              "Porta Potty",
              "Tent",
              "Bench",
              "Street Light"
            ]
          },
          {
            "type": "divider",
            "label": "Management"
          },
          {
            "type": "button",
            "label": "Delete Nearby Objects",
            "desc": "Remove all spawned objects near you."
          }
        ]
      },
      {
        "label": "Military & Aircraft",
        "tabs": [
          {
            "type": "divider",
            "label": "Aircraft"
          },
          {
            "type": "scrollable",
            "label": "Spawn Aircraft",
            "desc": "Spawn military aircraft.",
            "value": 1,
            "values": [
              "Buzzard",
              "Hydra",
              "Lazer",
              "Savage",
              "Valkyrie",
              "Akula",
              "Hunter",
              "Volatol",
              "Avenger",
              "Titan",
              "Cargo Plane"
            ]
          },
          {
            "type": "divider",
            "label": "Military Vehicles"
          },
          {
            "type": "scrollable",
            "label": "Spawn Military",
            "desc": "Spawn military ground vehicles.",
            "value": 1,
            "values": [
              "Rhino Tank",
              "Khanjali Tank",
              "APC",
              "Insurgent",
              "Barrage",
              "Half-Track",
              "Weaponized Tampa",
              "Anti-Aircraft Trailer"
            ]
          }
        ]
      }
    ]
  },
  {
    "label": "Settings",
    "type": "subMenu",
    "categories": [
      {
        "label": "Settings",
        "tabs": [
          {
            "type": "subMenu",
            "label": "Keybinds",
            "categories": []
          },
          {
            "type": "scrollable",
            "label": "Menu Positioning (X)",
            "desc": "This is the menu positioning based on the X-Axis.",
            "value": 1,
            "values": [
              "Left",
              "Center",
              "Right"
            ]
          },
          {
            "type": "scrollable",
            "label": "Menu Positioning (Y)",
            "desc": "This is the menu positioning based on the Y-Axis.",
            "value": 1,
            "values": [
              "Top",
              "Middle",
              "Bottom"
            ]
          },
          {
            "type": "button",
            "label": "Self Crash",
            "desc": "Crashes your game"
          }
        ]
      },
      {
        "label": "Design",
        "tabs": [
          {
            "type": "subMenu",
            "label": "Banners",
            "categories": []
          },
          {
            "type": "subMenu",
            "label": "Custom Colors",
            "categories": []
          },
          {
            "type": "button",
            "label": "Reset Ui"
          }
        ]
      },
      {
        "label": "Bypasses",
        "tabs": [
          {
            "type": "scrollable",
            "label": "Custom AC'S ",
            "value": 1,
            "values": [
              "Not Found"
            ]
          },
          {
            "type": "scrollable",
            "label": "CyberSecure",
            "value": 1,
            "values": [
              "Not Found"
            ]
          },
          {
            "type": "scrollable",
            "label": "Wx Anticheat",
            "value": 1,
            "values": [
              "Not Found"
            ]
          },
          {
            "type": "scrollable",
            "label": "EagleAC [Full]",
            "value": 1,
            "values": [
              "Not Found"
            ]
          },
          {
            "type": "scrollable",
            "label": "ElectronAC",
            "value": 1,
            "values": [
              "Not Found"
            ]
          },
          {
            "type": "scrollable",
            "label": "ReaperAC",
            "value": 1,
            "values": [
              "Not Found"
            ]
          },
          {
            "type": "scrollable",
            "label": "FiniAC",
            "value": 1,
            "values": [
              "Not Found"
            ]
          }
        ]
      },
      {
        "label": "Exploits",
        "tabs": [
          {
            "type": "button",
            "label": "Anticheat Checker"
          }
        ]
      }
    ]
  }
] as MenuEntry[]

export const mockMenuMeta = {
  sections: 8,
  categories: 22,
  tabs: 178,
}
