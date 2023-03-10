const { Client, MessageEmbed } = require("discord.js");
const client = new Client();
const express = require("express");
const app = express();
  const uptimeSchema = require("./src/schemas/uptime.js");
  const roles = require("./roles.json");

const conf = require("./src/configs/config.json");
const settings = require("./src/public/style.json");
const setting = require("./.env");

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const ejs = require("ejs");
const path = require("path");
const passport = require("passport");
const { Strategy } = require("passport-discord");
const session = require("express-session");
const mongoose = require("mongoose");
const url = require("url");
const moment = require("moment");
moment.locale("tr");
const cooldown = new Map();

// </> Middlewares </>
app.engine(".ejs", ejs.__express);
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: "50mb", extended: false, }));
app.use(cookieParser());
app.set("views", path.join(__dirname, "src/views"));
app.use(express.static(__dirname + "/src/public"));
app.use(session({ secret: "secret-session-thing", resave: false, saveUninitialized: false, }));
app.use(passport.initialize());
app.use(passport.session());


// </> Middlewares </>

// </> Authorization </>
passport.serializeUser((user, done) => done(null, user));

passport.deserializeUser((obj, done) => done(null, obj));

const scopes = ["identify", "guilds"];
passport.use(new Strategy({
      clientID: settings.clientID,
      clientSecret: settings.secret,
      callbackURL: settings.callbackURL,
      scope: scopes,
    },
    (accessToken, refreshToken, profile, done) => {
      process.nextTick(() => done(null, profile));
    })
);

app.get("/login", passport.authenticate("discord", { scope: scopes, }));
app.get("/callback", passport.authenticate("discord", { failureRedirect: "/error", }), (req, res) => res.redirect("/"));
app.get("/logout", (req, res) => {
  req.logOut();
  return res.redirect("/");
});
// </> Authorization </>

// </> DB Connection </>
mongoose.connect(settings.mongoURL, {
	useUnifiedTopology: true,
	useNewUrlParser: true,
	useFindAndModify: false,
});

mongoose.connection.on("connected", () => {
	console.log("Connected to DB");
});

mongoose.connection.on("error", () => {
	console.error("Connection Error!");
});
// </> DB Connection </>

// </> Pages </>
app.get("/", async (req, res) => {
  const guild = client.guilds.cache.get(conf.guildID);
  const owners = guild.members.cache.filter(x => x.roles.cache.has(conf.ownerRole));
  const admins = guild.members.cache.filter(x => x.roles.cache.has(conf.adminRole) && !owners.find(b => x.user.id == b));
  const codeSharers = guild.members.cache.filter(x => x.roles.cache.has(conf.codeSharer) && !owners.find(b => x.user.id == b) && !admins.find(b => x.user.id == b));
  res.render("index", {
    user: req.user,
    icon: guild.iconURL({ dynamic: true }),
    owners,
    admins,
    codeSharers,
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  });
});

app.get("/discord", (req, res) => 
  res.render("discord", {
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    conf
  })
);

app.get("/yetkililer", async (req, res) => {
  const guild = client.guilds.cache.get(conf.guildID);
  const owners = guild.members.cache.filter(x => x.roles.cache.has(conf.ownerRole));
  const admins = guild.members.cache.filter(x => x.roles.cache.has(conf.adminRole) && !owners.find(b => x.user.id == b));
  const codeSharers = guild.members.cache.filter(x => x.roles.cache.has(conf.codeSharer) && !owners.find(b => x.user.id == b) && !admins.find(b => x.user.id == b));
  res.render("yetkililer", {
    user: req.user,
    icon: guild.iconURL({ dynamic: true }),
    owners,
    admins,
    codeSharers,
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  });
});


app.get("/information", (req, res) =>
  res.render("info", {
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  })
);


 app.get("/profile/:userID", async (req, res) => {
  const userID = req.params.userID;
  const guild = client.guilds.cache.get(conf.guildID);
  const member = guild.members.cache.get(userID);
  if (!member) return error(res, 501, "B??yle bir kullan??c?? bulunmuyor!");
  const userData = require("./src/schemas/user");
  const codeData = require("./src/schemas/code");
  let data = await userData.findOne({ userID });
  const code = await codeData.find({});
  let auth;
  if (member.roles.cache.has(conf.ownerRole)) auth = "Owner";
  else if (member.roles.cache.has(conf.adminRole)) auth = "Admin";
  else if (member.roles.cache.has(conf.codeSharer)) auth = "Code Sharer";
  else if (member.roles.cache.has(conf.booster)) auth = "Booster";
  else auth = "Member";
  res.render("profile", {
    user: req.user,
    member,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    auth,
    color: member.displayHexColor,
    data: data ? data : {},
    code,
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  });
});
app.get("/admin", async (req, res) => {
  if (!req.user) return error(res, 138, "Bu sayfaya girmek i??in siteye giri?? yapmal??s??n!");
  const guild = client.guilds.cache.get(conf.guildID);
  const member = guild.members.cache.get(req.user.id);
  if (!member) return error(res, 138, "Bu sayfaya girmek i??in sunuzumuza kat??lmal??s??n!");
   if (member && !member.roles.cache.has(conf.ownerRole) && !member.roles.cache.has(conf.adminRole))  return error(res, 501, "Bu sayfaya girmek i??in yetkin bulunmuyor!");
  const codeData = require("./src/schemas/code");
  const code = await codeData.find({}).sort({ date: -1 });
  res.render("admin", {
    user: req.user,
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    code
  });
});

app.get("/bug/:codeID", async (req, res) => {
  if (!req.user || !client.guilds.cache.get(conf.guildID).members.cache.has(req.user.id)) return error(res, 138, "Bu sayfaya girmek i??in Discord sunucumuza kat??lman??z ve siteye giri?? yapman??z gerekmektedir.");
  res.render("bug", {
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null,
    codeID: req.params.codeID
  });
});

app.get("/bug", async (req, res) => {
  if (!req.user || !client.guilds.cache.get(conf.guildID).members.cache.has(req.user.id)) return error(res, 138, "Bu sayfaya girmek i??in Discord sunucumuza kat??lman??z ve siteye giri?? yapman??z gerekmektedir.");
  res.render("bug", {
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null,
  });
});

app.post("/bug", async (req, res) => {
  const guild = client.guilds.cache.get(conf.guildID);
  const member = req.user ? guild.members.cache.get(req.user.id) : null;
  if (!req.user || !member) return error(res, 138, "Bu sayfaya girmek i??in Discord sunucumuza kat??lman??z ve siteye giri?? yapman??z gerekmektedir.");
  const codeData = require("./src/schemas/code");
  console.log(req.body)
  const code = await codeData.findOne({ id: req.body.id });
  if (!code) return error(res, 404, req.body.id+" ID'li bir kod bulunamad??!");
  
  if (!code.bug) {
    code.bug = req.body.bug;
    code.save();
  } else return error(res, 208, "Bu kodda zaten bug bildirildi!")
  
  const channel = client.channels.cache.get(conf.bugLog);
  const embed = new MessageEmbed()
  .setAuthor(req.user.username, member.user.avatarURL({ dynamic: true }))
  .setThumbnail(guild.iconURL({ dynamic: true }))
  .setTitle("Bir bug bildirildi!")
  .setDescription(`
??? Kod ad??: [${code.name}](https://${conf.domain}/${code.rank}/${req.body.id})
??? Bug bildiren: ${guild.members.cache.get(req.user.id).toString()}
??? Bug: ${req.body.bug}
  `)
  .setColor("RED")
  channel.send(embed);
  res.redirect(`/${code.rank}/${req.body.id}`);
});




//Sonradan ekleme

    
//ban
app.get("/ban-affi-bilgi", (req, res) =>
  res.render("ban-bilgi", {
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  })
);
app.get("/ban-affi", async (req, res) => {
  res.render("ban-ba??vur", {
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null,
  });
});
app.post("/ban-affi", async (req, res) => {
  const guild = client.guilds.cache.get(conf.guildID);
  const member = req.user ? guild.members.cache.get(req.user.id) : null;
  const codeData = require("./src/schemas/code");
  console.log(req.body)
  
  
  const channel = client.channels.cache.get(conf.banaff);
  const embed = new MessageEmbed()
  .setThumbnail(guild.iconURL({ dynamic: true }))
  .setTitle("Bir unban iste??i bildirildi!")
  .setDescription(`
??? Unban isteyen: <@!${req.body.bug2}>
??? Banlanma sebebi ve notu: ${req.body.bug}
  `)
  .setColor("RED")
  channel.send(embed);
  res.redirect(`https://psychopath-techonology.ml/`);
});
//ban


//Oyunlar
app.get("/psychogame-beta", (req, res) =>
  res.render("oyunlar/oyunlar.ejs", {
  
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  })
);
app.get("/cow", async (req, res) => {
 res.render("oyunlar/cow.ejs", {
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    guild: client.guilds.cache.get(conf.guildID),
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  });

});
app.get("/bowling", async (req, res) => {
 res.render("oyunlar/bowling.ejs", {
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    guild: client.guilds.cache.get(conf.guildID),
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  });

});
app.get("/eww3", async (req, res) => {
 res.render("oyunlar/eww3.ejs", {
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    guild: client.guilds.cache.get(conf.guildID),
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  });

});
//Oyunlar



//Sonradan ekleme

app.get("/haberpaylas", async (req, res) => {
  if(!req.user || !client.guilds.cache.get(conf.guildID).members.cache.has(req.user.id)) return error (res, 138, "Kod payla??abilmek i??in Discord sunucumuza kat??lman??z ve siteye giri?? yapman??z gerekmektedir.");
  res.render("haberPaylas", {
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    isOwner: client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id).roles.cache.has(conf.ownerRole),
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  });
});
app.post("/haberpaylasing", async (req, res) => {
  const guild = client.guilds.cache.get(conf.guildID);
  const member = req.user ? guild.members.cache.get(req.user.id) : null;
  if(!req.user || !member) return error(res, 138, "Haber payla??abilmek i??in Discord sunucumuza kat??lman??z ve siteye giri?? yapman??z gerekmektedir.");
  const codeData = require("./src/schemas/code");
  const userData = require("./src/schemas/user");
  if (member && conf.notOwner.some((x) => member.roles.cache.has(x) || member.user.id === x)) return error(res, 502, "Kod payla??ma iznin bulunmuyor!");
  const id = randomStr(4);
  
  let haber = req.body;
  haber.id = id;
  haber.date = Date.now();
  if(!haber.Sharers) haber.sharers = req.user.id;
  haber.sharers = haber.sharers.trim().split(" ").filter(x => guild.members.cache.get(x));
  
  
})

app.get("/share", async (req, res) => {
  if (!req.user || !client.guilds.cache.get(conf.guildID).members.cache.has(req.user.id)) return error(res, 138, "Kod payla??abilmek i??in Discord sunucumuza kat??lman??z ve siteye giri?? yapman??z gerekmektedir.");
  res.render("shareCode", {
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    isStaff: client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id).roles.cache.has(conf.codeSharer),
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  });
});

app.post("/sharing", async (req, res) => {
  const guild = client.guilds.cache.get(conf.guildID);
  const member = req.user ? guild.members.cache.get(req.user.id) : null;
  if (!req.user || !member) return error(res, 138, "Kod payla??abilmek i??in Discord sunucumuza kat??lman??z ve siteye giri?? yapman??z gerekmektedir.");
  const codeData = require("./src/schemas/code");
  const userData = require("./src/schemas/user");
  if (member && conf.notCodeSharer.some((x) => member.roles.cache.has(x) || member.user.id === x)) return error(res, 502, "Kod payla??ma iznin bulunmuyor!");
  if (cooldown.get(req.user.id) && cooldown.get(req.user.id).count >= 30) return error(res, 429, "10 dakika i??erisinde en fazla 3 kod payla??abilirsin!");
  const id = randomStr(8);
  
  let code = req.body;
  code.id = id;
  code.date = Date.now();
  if (!code.sharers) code.sharers = req.user.id;
  code.sharers = code.sharers.trim().split(" ").filter(x => guild.members.cache.get(x));
  if (code.sharers && !code.sharers.includes(req.user.id)) code.sharers.unshift(req.user.id);
  if (!code.modules) code.modules = "discord.js";
  if (!code.mainCode || code.mainCode && (code.mainCode.trim().toLowerCase() === "yok" || code.mainCode.trim() === "-")) code.mainCode = "";
  if (!code.command || code.command && (code.command.trim().toLowerCase() === "yok" || code.command.trim() === "-")) code.command = "";
  cooldown.get(req.user.id) ? cooldown.set(req.user.id, { count: cooldown.get(req.user.id).count += 1 }) : cooldown.set(req.user.id, { count: 1 });
  if (await cooldown.get(req.user.id).count === 1) setTimeout(() => cooldown.delete(req.user.id), 1000*60*10);
  
  code.sharers.map(async x => {
    const data = await userData.findOne({ userID: x });
    if (!data) {
      new userData({
        userID: x,
        codes: [code]
      }).save();
    } else {
      data.codes.push(code);
      data.save();
    }
  });
  
  let newCodeData = new codeData({
    name: code.name,
    id: code.id,
    sharers: code.sharers,
    desc: code.desc.trim(),
    modules: code.modules.trim(),
    mainCode: code.mainCode.trim(),
    command: code.command.trim(),
    rank: code.rank,
    date: code.date
  }).save();
const channel = guild.channels.cache.get(conf.codeLog);
  let color;
  if (code.rank === "normal") color = "#bfe1ff";
  else if (code.rank === "gold") color = "#F1C531";
  else if (code.rank === "diamond") color = "#3998DB";
  else if (code.rank === "ready") color = "#f80000";
  else if (code.rank === "fromyou") color = ""
  const embed = new MessageEmbed()
  .setAuthor(req.user.username, member.user.avatarURL({ dynamic: true }))
  .setThumbnail(guild.iconURL({ dynamic: true }))
  .setTitle(`${code.rank} kategorisinde bir kod payla????ld??!`)
  .setDescription(`
  ??? Kod ad??: [${code.name}](https://${conf.domain}/${code.rank}/${id})
  ??? Kod A????klamas??: ${code.desc}
  ??? Kodu payla??an: ${member.toString()}
  `)
  .setColor(color)
  channel.send(embed);
  res.redirect(`/${code.rank}/${id}`);
});

app.get("/normal", async (req, res) => {
  const codeData = require("./src/schemas/code");
  const data = await codeData.find({ rank: "normal" }).sort({ date: -1 });
  res.render("normal", {
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    data,
    moment,
    guild: client.guilds.cache.get(conf.guildID),
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  });
});
app.get("/bdfd", async (req, res) => {
  const codeData = require("./src/schemas/code");
  const data = await codeData.find({ rank: "bdfd" }).sort({ date: -1 });
  res.render("bdfd", {
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    data,
    moment,
    guild: client.guilds.cache.get(conf.guildID),
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  });
});
app.get("/bdfd/:codeID", async (req, res) => {
  if (!req.user || !client.guilds.cache.get(conf.guildID).members.cache.has(req.user.id)) return error(res, 138, "Kodlar?? g??rebilmek i??in Discord sunucumuza kat??lman??z ve siteye giri?? yapman??z gerekmektedir.");
  const guild = client.guilds.cache.get(conf.guildID);
  const member = req.user ? guild.members.cache.get(req.user.id) : null;
  if (member && !member.roles.cache.has(conf.bdfd)  && !member.roles.cache.has(conf.booster) && !member.roles.cache.has(conf.ownerRole) && !member.roles.cache.has(conf.adminRole)) return error(res, 501, "Bu kodu g??rebilmek i??in gerekli rolleriniz bulunmamaktad??r! L??tfen bilgilendirme sayfas??n?? okuyunuz!");
  const codeID = req.params.codeID;
  if (!codeID) return res.redirect("/");
  const codeData = require("./src/schemas/code");
  const code = await codeData.findOne({ rank: "bdfd", id: codeID });
  if (!code) return error(res, 404, codeID+" ID'li bir kod bulunmuyor!");
  res.render("code", {
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    data: code,
    guild,
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  });
});
app.get("/gold", async (req, res) => {
  const codeData = require("./src/schemas/code");
  const data = await codeData.find({ rank: "gold" }).sort({ date: -1 });
  res.render("goldCodes", {
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    data,
    moment,
    guild: client.guilds.cache.get(conf.guildID),
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  });
});

app.get("/diamond", async (req, res) => {
  const codeData = require("./src/schemas/code");
  const data = await codeData.find({ rank: "diamond" }).sort({ date: -1 });
  res.render("diamondCodes", {
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    data,
    moment,
    guild: client.guilds.cache.get(conf.guildID),
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  });
});

app.get("/ready", async (req, res) => {
  const codeData = require("./src/schemas/code");
  const data = await codeData.find({ rank: "ready" }).sort({ date: -1 });
  res.render("readySystems", {
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    data,
    moment,
    guild: client.guilds.cache.get(conf.guildID),
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  });
});

app.get("/fromyou", async (req, res) => {
  const codeData = require("./src/schemas/code");
  const data = await codeData.find({ rank: "fromyou" }).sort({ date: -1 });
  res.render("fromyou", {
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    data,
    moment,
    guild: client.guilds.cache.get(conf.guildID),
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  });
});

app.get("/normal/:codeID", async (req, res) => {
  if (!req.user || !client.guilds.cache.get(conf.guildID).members.cache.has(req.user.id)) return error(res, 138, "Kodlar?? g??rebilmek i??in Discord sunucumuza kat??lman??z ve siteye giri?? yapman??z gerekmektedir.");
  const guild = client.guilds.cache.get(conf.guildID);
  const member = req.user ? guild.members.cache.get(req.user.id) : null;
  if (member && !member.roles.cache.has(conf.booster) && !member.roles.cache.has(conf.ownerRole) && !member.roles.cache.has(conf.adminRole)  && !member.roles.cache.has(conf.normalRole))  return error(res, 501, "Bu kodu g??rebilmek i??in gerekli rolleriniz bulunmamaktad??r! L??tfen bilgilendirme sayfas??n?? okuyunuz!");
  const codeID = req.params.codeID;
  if (!codeID) return res.redirect("/");
  const codeData = require("./src/schemas/code");
  const code = await codeData.findOne({ rank: "normal", id: codeID });
  if (!code) return error(res, 404, codeID+" ID'li bir kod bulunmuyor!");
  res.render("code", {
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    data: code,
    guild,
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  });
});

app.get("/gold/:codeID", async (req, res) => {
  if (!req.user || !client.guilds.cache.get(conf.guildID).members.cache.has(req.user.id)) return error(res, 138, "Kodlar?? g??rebilmek i??in Discord sunucumuza kat??lman??z ve siteye giri?? yapman??z gerekmektedir.");
  const guild = client.guilds.cache.get(conf.guildID);
  const member = req.user ? guild.members.cache.get(req.user.id) : null;
  const codeID = req.params.codeID;
  if (!codeID) return res.redirect("/");
  if (member && !member.roles.cache.has(conf.goldRole) && !member.roles.cache.has(conf.booster) && !member.roles.cache.has(conf.ownerRole) && !member.roles.cache.has(conf.adminRole)) return error(res, 501, "Bu kodu g??rebilmek i??in gerekli rolleriniz bulunmamaktad??r! L??tfen bilgilendirme sayfas??n?? okuyunuz!");
  const codeData = require("./src/schemas/code");
  const code = await codeData.findOne({ rank: "gold", id: codeID });
  if (!code) return error(res, 404, codeID+" ID'li bir kod bulunmuyor!");
  res.render("code", {
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    data: code,
    guild,
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  });
});

app.get("/diamond/:codeID", async (req, res) => {
  if (!req.user || !client.guilds.cache.get(conf.guildID).members.cache.has(req.user.id)) return error(res, 138, "Kodlar?? g??rebilmek i??in Discord sunucumuza kat??lman??z ve siteye giri?? yapman??z gerekmektedir.");
  const guild = client.guilds.cache.get(conf.guildID);
  const member = req.user ? guild.members.cache.get(req.user.id) : null;
  const codeID = req.params.codeID;
  if (!codeID) return res.redirect("/");
  if (member && !member.roles.cache.has(conf.diaRole) && !member.roles.cache.has(conf.booster) && !member.roles.cache.has(conf.ownerRole) && !member.roles.cache.has(conf.adminRole)) return error(res, 501, "Bu kodu g??rebilmek i??in gerekli rolleriniz bulunmamaktad??r! L??tfen bilgilendirme sayfas??n?? okuyunuz!");
  const codeData = require("./src/schemas/code");
  const code = await codeData.findOne({ rank: "diamond", id: codeID });
  if (!code) return error(res, 404, codeID+" ID'li bir kod bulunmuyor!");
  res.render("code", {
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    data: code,
    guild,
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  });
});

app.get("/ready/:codeID", async (req, res) => {
  if (!req.user || !client.guilds.cache.get(conf.guildID).members.cache.has(req.user.id)) return error(res, 138, "Kodlar?? g??rebilmek i??in Discord sunucumuza kat??lman??z ve siteye giri?? yapman??z gerekmektedir.");
  const guild = client.guilds.cache.get(conf.guildID);
  const member = guild.members.cache.get(req.user.id);
  const codeID = req.params.codeID;
  if (!codeID) return res.redirect("/");
  if (member && !member.roles.cache.has(conf.readySystemsRole) && !member.roles.cache.has(conf.booster) && !member.roles.cache.has(conf.ownerRole) && !member.roles.cache.has(conf.adminRole)) return error(res, 501, "Bu kodu g??rebilmek i??in gerekli rolleriniz bulunmamaktad??r! L??tfen bilgilendirme sayfas??n?? okuyunuz!");
  const codeData = require("./src/schemas/code");
  const code = await codeData.findOne({ rank: "ready", id: codeID });
  if (!code) return error(res, 404, codeID+" ID'li bir kod bulunmuyor!");
  res.render("code", {
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    data: code,
    guild,
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  });
});

app.get("/fromyou/:codeID", async (req, res) => {
  if (!req.user || !client.guilds.cache.get(conf.guildID).members.cache.has(req.user.id)) return error(res, 138, "Kodlar?? g??rebilmek i??in Discord sunucumuza kat??lman??z ve siteye giri?? yapman??z gerekmektedir.");
  const guild = client.guilds.cache.get(conf.guildID);
  const codeID = req.params.codeID;
  if (!codeID) return res.redirect("/");
  const codeData = require("./src/schemas/code");
  const code = await codeData.findOne({ rank: "fromyou", id: codeID });
  if (!code) return error(res, 404, codeID+" ID'li bir kod bulunmuyor!");
  res.render("code", {
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    data: code,
    guild,
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  });
});

app.get("/delete/:rank/:id", async (req, res) => {
  if (!req.user) return error(res, 138, "Bu sayfaya girmek i??in siteye giri?? yapmal??s??n!");
  const guild = client.guilds.cache.get(conf.guildID);
  const member = guild.members.cache.get(req.user.id);
    const ad = client.guilds.cache.get(conf.guildID);

  if (!member) return error(res, 138, "Bu sayfaya girmek i??in sunuzumuza kat??lmal??s??n!");
  const codeData = require("./src/schemas/code");
  const userData = require("./src/schemas/user");
  const code = await codeData.findOne({ rank: req.params.rank, id: req.params.id });
  if (!code) return error(res, 404, req.params.id+" ID'li bir kod bulunmuyor!");
  if (member  && !member.roles.cache.has(conf.ownerRole) && !member.roles.cache.has(conf.adminRole) )  return error(res, 501, "Bu sayfaya girmek i??in yetkin bulunmuyor!");

  
const channel = guild.channels.cache.get(conf.codeLog);
  let color;
  if (code.rank === "normal") color = "#bfe1ff";
  else if (code.rank === "gold") color = "#F1C531";
  else if (code.rank === "diamond") color = "#3998DB";
  else if (code.rank === "ready") color = "#f80000";
  else if (code.rank === "fromyou") color = ""
  const embed = new MessageEmbed()
  .setAuthor(req.user.username, member.user.avatarURL({ dynamic: true }))
  .setThumbnail(guild.iconURL({ dynamic: true }))
  .setTitle(`${code.rank} kategorisinde bir kod silindi!`)
  .setDescription(`
  ??? Kod ad??: [${code.name}](https://${conf.domain}/${code.rank})
  ??? Kod A????klamas??: ${code.desc}
  ??? Kodu payla??an: ${member.toString()}
  `)
  .setColor(color)
  channel.send(embed);
  res.redirect("https://psychopath-techonology.ml/");
  
    const data = await userData.findOne({ userID: req.user.id });
  if (data) {
    data.codes = data.codes.filter(x => x.id !== req.params.id);
    data.save();
  }
  
  code.deleteOne();
  res.redirect("https://psychopath-techonology.ml/");

});



app.get("/edit/:rank/:id", async (req, res) => {
  if (!req.user) return error(res, 138, "Bu sayfaya girmek i??in siteye giri?? yapmal??s??n!");
  const guild = client.guilds.cache.get(conf.guildID);
  const member = guild.members.cache.get(req.user.id);
  if (!member) return error(res, 138, "Bu sayfaya girmek i??in sunuzumuza kat??lmal??s??n!");
  const codeData = require("./src/schemas/code");
  const code = await codeData.findOne({ rank: req.params.rank, id: req.params.id });
  if (!code) return error(res, 404, req.params.id+" ID'li bir kod bulunmuyor!");
  if (!member.hasPermission(8) ||??!code.sharers.includes(req.user.id)) return error(res, 401, "Bu sayfaya girmek i??in yetkin bulunmuyor!");
  res.render("editCode", {
    user: req.user,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    isStaff: client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id).roles.cache.has("783442672496803891"),
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null,
    rank: req.params.rank,
    id: req.params.id
  });
});

app.post("/edit", async (req, res) => {
  const guild = client.guilds.cache.get(conf.guildID);
  const member = req.user ? guild.members.cache.get(req.user.id) : null;
  if (!req.user || !member) return error(res, 138, "Kod payla??abilmek i??in Discord sunucumuza kat??lman??z ve siteye giri?? yapman??z gerekmektedir.");
  const codeData = require("./src/schemas/code");
  const code = await codeData.findOne({ id: req.body.id });
  console.log(code)
  if (!code) return error(res, 404, req.body.id+" ID'li bir kod bulunmuyor!")
  
  let body = req.body;
  if (!body.name) body.name = code.name;
  if (!body.sharers) body.sharers = code.sharers;
  if (!body.desc) body.desc = code.desc;
  if (!body.modules) body.modules = code.modules;
  if (!body.mainCode) body.mainCode = code.mainCode;
  if (!body.command) body.command = code.command;
  if (!body.rank) body.rank = code.rank;
  
  code.name = body.name;
  code.sharers = body.sharers;
  code.desc = body.desc
  code.modules = body.modules
  code.mainCode = body.mainCode
  code.command = body.command
  code.rank = body.rank
  code.bug = null;
  code.save();
 
  const channel = client.channels.cache.get(conf.codeLog);
  const embed = new MessageEmbed()
  .setAuthor(req.user.username, member.user.avatarURL({ dynamic: true }))
  .setThumbnail(guild.iconURL({ dynamic: true }))
  .setTitle("Bir kod d??zenlendi!")
  .setDescription(`
  ??? Kod ad??: [${body.name}](https://${conf.domain}/${body.rank}/${body.id})
  ??? Kod A????klamas??: ${body.desc}
  ??? Kodu payla??an: ${member.toString()}
  `)
  .setColor("YELLOW");
  channel.send(embed);
  res.redirect(`/${body.rank}/${body.id}`);
});


  
app.post("/like", async (req, res) => {
  if (!req.user) return;
  const codeData = require("./src/schemas/code");
  const userData = require("./src/schemas/user");
  const code = await codeData.findOne({ id: req.body.id });
  if (code.sharers.includes(req.user.id)) return;
  if (code.likedUsers && code.likedUsers.includes(req.user.id)) return;
  if (req.body.durum === "true") {
  if (!code.likedUsers) {
    code.likedUsers = [req.user.id]
    code.save();
  } else {
    code.likedUsers.push(req.user.id)
    code.save();
  }
  code.sharers.map(async x => {
    const sharerData = await userData.findOne({ userID: x });
    sharerData.getLikeCount += 1;
    sharerData.save();
  });
  } else {
    if (code.likedUsers && !code.likedUsers.includes(req.user.id)) return;
    code.likedUsers = code.likedUsers.filter(x => x !== req.user.id);
    code.save();
    code.sharers.map(async x => {
      const sharerData = await userData.findOne({ userID: x });
      sharerData.getLikeCount -= 1;
      sharerData.save();
    });
  }
});




app.get("/error", (req, res) => {
  res.render("error", {
    user: req.user,
    statuscode: req.query.statuscode,
    message: req.query.message,
    icon: client.guilds.cache.get(conf.guildID).iconURL({ dynamic: true }),
    reqMember: req.user ? client.guilds.cache.get(conf.guildID).members.cache.get(req.user.id) : null
  });
});






app.use((req, res) => error(res, 404, "Sayfa bulunamad??!"));
// </> Pages </>


// </> Functions </>
const error = (res, statuscode, message) => {
  return res.redirect(url.format({ pathname: "/error", query: { statuscode, message }}));
};

const randomStr = (length) => {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
client.on("ready", () => {
  console.log("Site Haz??r!");
  setInterval(() => {
const psycho = client.guilds.cache.get("854750196315062302")
if(!psycho){
console.log("L??tfen bir sunucu ismi girin")
}
if(psycho){
 setTimeout(() => {
 psycho.setName("PsychoPath Technology")
  }, 4000) //1000=1saniye
    setTimeout(() => {
 psycho.setName("PsychoPath #YetkiliAl??m")
 }, 4000)//1000=1saniye
    setTimeout(() => {
  psycho.setName("PsychoPath #Serverlist")
 }, 4000)//1000=1saniye
      setTimeout(() => {
 psycho.setName("PsychoPath #Botlist")
 }, 4000)//1000=1saniye
}
}, 2000) //d??ng
});

// </> Functions </>

app.listen(process.env.PORT || 3000);
client.login(settings.token).catch((err) => console.log(err));

