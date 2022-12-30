
Sign up
vcodes-xyz
/
benedict
Public
Code
Issues
4
Pull requests
Actions
Projects
Security
Insights
benedict/config.js
@EliteNover
EliteNover Update config.js (#104)
 5 contributors
167 lines (162 sloc)  5.69 KB

        module.exports = {
            bot: {
                token: "", // Bot List Bot Token from https://discord.com/developers/applications
                prefix: "",
                owners: [""],
                mongourl: "",  //https://mongodb.com/cloud/atlas/register
                servers: {
                    token: "", // Server List Bot Token
                    prefix: ""
                }
            },
        
            website: {
                callback: "", //example : https://vcodes.xyz avoid / at last. 
                secret: "",
                clientID: "", // Bot client id.
                tags: [ "Moderation", "Fun", "Minecraft","Economy","Guard","NSFW","Anime","Invite","Music","Logging", "Web Dashboard", "Reddit", "Youtube", "Twitch", "Crypto", "Leveling", "Game", "Roleplay", "Utility", "Turkish" ],
                languages: [
                    { flag: 'gb', code: 'en', name: 'English' },
                    { flag: 'tr', code: 'tr', name: 'Türkçe' },
                    { flag: 'de', code: 'de', name: 'Deutsch' }
                ],
                servers: {
                    tags: [
                    {
                        icon: "fal fa-code",
                        name: "Development"
                    },
                    {
                        icon: "fal fa-play",
                        name: "Stream"
                    },
                    {
                        icon: "fal fa-camera",
                        name: "Media"
                    },
                    {
                        icon: 'fal fa-building',
                        name: 'Company'
                    },
                    {
                        icon: 'fal fa-gamepad',
                        name: 'Game'
                    },
                    {
                        icon: 'fal fa-icons',
                        name: 'Emoji'
                    },
                    {
                        icon: 'fal fa-robot',
                        name: 'Bot List'
                    },
                    {
                        icon: 'fal fa-server',
                        name: 'Server List'
                    },
                    {
                        icon: 'fal fa-moon-stars',
                        name: 'Turkish'
                    },
                    {
                        icon: 'fab fa-discord',
                        name: 'Support'
                    },
                    {
                        icon: 'fal fa-volume',
                        name: 'Sound'
                    },
                    {
                        icon: 'fal fa-comments',
                        name: 'Chatting'
                    },
                    {
                        icon: 'fal fa-lips',
                        name: 'NSFW'
                    },
                    {
                      icon: "fal fa-comment-slash",
                      name: "Challange"
                    },
                    {
                      icon: "fal fa-hand-rock",
                      name: "Protest"
                    },
                    {
                      icon: "fal fa-headphones-alt",
                      name: "Roleplay"
                    },
                    {
                      icon: "fal fa-grin-alt",
                      name: "Meme"
                    },
                    {
                      icon: "fal fa-shopping-cart",
                      name: "Shop"
                    },
                    {
                      icon: "fal fa-desktop",
                      name: "Technology"
                    },
                    {
                      icon: "fal fa-laugh",
                      name: "Fun"
                    },
                    {
                      icon: "fal fa-share-alt",
                      name: "Social"
                    },
                    {
                      icon: "fal fa-laptop",
                      name: "E-Spor"
                    },
                    {
                      icon: 'fal fa-palette',
                      name: 'Design'
                    },
                    {
                      icon: 'fal fa-users',
                      name: 'Community'
                    }
                    ]                
                }
            },
        
            server: {
                id: "",
                invite: "https://discord.gg/3J6n8RTqen",
                roles: {
                    administrator: "998167574523170906",
                    moderator: "",
                    profile: {
                        sitecreator :"998167574523170906 ",
                        booster: "",
                        sponsor: "",
                        supporter: "",
                        partnerRole: ""
                    },
                    codeshare: {
                        javascript: "",
                        html: "",
                        substructure: "",
                        bdfd: "", // Bot Designer For Discord
                        fiveInvite: "",
                        tenInvite: "",
                        fifteenInvite: "",
                        twentyInvite: ""
                    },
                    botlist: {
                        developer: "",
                        certified_developer: "",
                        bot: "", // This is not your Bot ID, This is the Role ID Approved Bots get when they join your server
                        certified_bot: "",
                    }
                },
                channels: {
                    codelog: "",
                    login: "",
                    webstatus: "",
                    uptimelog: "",
                    botlog: "",
                    votes: ""
                }
            }
        
        
        }