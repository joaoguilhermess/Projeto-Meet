const fs = require("fs");
const ppt = require("puppeteer-extra");

ppt.use(require("puppeteer-extra-plugin-stealth")());

const h24 = 24 * 60 * 60 * 1000;

var browser;
const print = false;

async function iniciar(options) {
	var now = new Date();
	var di = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
		options.inicio.horas,
		options.inicio.minutos,
		0,
		0
	);
	var df = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
		options.fim.horas,
		options.fim.minutos,
		0,
		0
	);
	if (now.getTime() > di.getTime()) {
		// console.log("já passou");
		if (now.getTime() < df.getTime()) {
			// console.log("ainda não acabou");
		} else {
			// console.log("já acabou");
			di.setDate(di.getDate() + 1);
		}
	} else {
		// console.log("ainda não passou");
	}
	var dc = new Date(di.getTime() - now.getTime());
	dc = dc.setMinutes(dc.getMinutes() + (180 - now.getTimezoneOffset()));
	await log("Definindo Loop Após: " + (new Date(0, 0, 0, 0, 0, 0, dc)).toLocaleTimeString([], {hour12: false}));
	setTimeout(function(options) {
		async function run(options) {
			var now = new Date();
			if (options.dias.includes(now.getDay())) {
				await log("Iniciando Meet...");
				connect(options);
			}
		}
		setInterval(run, h24, options);
		run(options);
	}, dc, options);
}

async function fechar(options, page) {
	var now = new Date();
	var df = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
		options.fim.horas,
		options.fim.minutos,
		0,
		0
	);
	var dc = new Date(df.getTime() - now.getTime());
	dc = new Date(dc.setMinutes(dc.getMinutes() + (180 - now.getTimezoneOffset())));
	await log("Definindo Fechamento do Meet Após: " + (new Date(0, 0, 0, 0, 0, 0, dc)).toLocaleTimeString([], {hour12: false}));
	setTimeout(async function(page) {
		await log("Fechando Meet...", page);
		await page.close();
	}, dc.getTime(), page);
};

function format(number, len) {
	var str = "" + number;
	while (str.length < len) {
		str = "0" + str;
	}
	return str;
}

async function log(text, page) {
	var d = new Date();
	var str = "Date: " + ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"][d.getDay()] +
		" " + format(d.getDate(), 2) + "/" +
		format((d.getMonth() + 1), 2) + "/" +
		format(d.getFullYear(), 4) + " " +
		format(d.getHours(), 2) + ":" +
		format(d.getMinutes(), 2) + ":" +
		format(d.getSeconds(), 2) + ":" +
		format(d.getMilliseconds(), 4) + " || ";
	console.log(str + "Log: " + text);
	if (page) {
		str += "Page ID: " + page.mainFrame()._id + " || ";
	}
	str += "Log: " + text;
	if (page) {
		var l = "";
		var n = "log.txt";
		if (fs.existsSync(n)) {
			l = fs.readFileSync(n);
		}
		l += str + "\n";
		fs.writeFileSync(n, l);
		if (print) {
			var prints =  __dirname + "\\prints";
			if (!fs.existsSync(prints)) {
				fs.mkdirSync(prints);
			}
			await page.screenshot({
				fullPage: false,
				path: prints + "\\" + text.replace("...", "") + ".png"
			});
		}
	}
}

async function connect(options) {
	try {
		await log("Código Definido: " + options.link);
		await log("Email Definido: " + options.email);
		var s = "";
		for (var i = 0; i < options.senha.length; i++) {
			s += "*";
		}
		await log("Senha Definida: " + s);
		var dias = [];
		for (var i = 0; i < options.dias.length; i++) {
			dias.push(["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"][options.dias[i]]);
		}
		await log("Dias Definidos: " + dias.join(","));
		await log("Início Definido: " + options.inicio.horas + ":" + options.inicio.minutos);
		await log("Encerramento Definido: " + options.fim.horas + ":" + options.fim.minutos);

		if (!browser) {
			await log("Iniciando Browser...");
			browser = await ppt.launch({
				// executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
				userDataDir: "/app/Meet/data",
				headless: true,
				args: [
            "--autoplay-policy=user-gesture-required",
			    "--disable-background-networking",
			    "--disable-background-timer-throttling",
			    "--disable-backgrounding-occluded-windows",
			    "--disable-breakpad",
			    "--disable-client-side-phishing-detection",
			    "--disable-component-update",
		    	"--disable-default-apps",
          "--disable-dev-shm-usage",
		    	"--disable-domain-reliability",
		    	"--disable-extensions",
		    	"--disable-features=AudioServiceOutOfProcess",
		    	"--disable-hang-monitor",
		    	"--disable-ipc-flooding-protection",
			    "--disable-notifications",
			    "--disable-offer-store-unmasked-wallet-cards",
			    "--disable-popup-blocking",
			    "--disable-print-preview",
			    "--disable-prompt-on-repost",
			    "--disable-renderer-backgrounding",
			    "--disable-setuid-sandbox",
			    "--disable-speech-api",
			    "--disable-sync",
			    "--hide-scrollbars",
          "--ignore-gpu-blacklist",
          "--metrics-recording-only",
			    "--mute-audio",
			    "--no-default-browser-check",
			    "--no-first-run",
			    "--no-pings",
			    "--no-sandbox",
			    "--no-zygote",
			    "--password-store=basic",
			    "--use-gl=swiftshader",
		    	"--use-mock-keychain",
					"--disable-notifications",
					// "--no-sandbox",
					'--use-fake-ui-for-media-strea',
					"--mute-audio"
					// "--start-maximized"
					// '--use-file-for-fake-video-capture="C:\\Users\\Usuario\\Desktop\\video.mp4"'
				]
			});
		}
		await log("Iniciando Nova Página...");
		var page = await browser.newPage();
    page.setViewport({width: 150, height: 150})
		var url = "https://accounts.google.com/signin/v2/identifier?ltmpl=meet&continue=https%3A%2F%2Fmeet.google.com%2F" + options.link +
			"%3Fhs%3D196&flowName=GlifWebSignIn&flowEntry=ServiceLogin";
		var url2 = "https://accounts.google.com/AccountChooser/identifier?continue=https%3A%2F%2Fmeet.google.com%2F" + options.link + 
		"&hl=pt_BR&flowName=GlifWebSignIn&flowEntry=AccountChooser";

		// page.setRequestInterception(true);

		// page.on("request", async function(req) {
		// 	var obj = {}
		// 	var text = "";
		// 	var list = Object.keys(req);
		// 	for (var i = 0; i < list.length; i++) {
		// 		try {
		// 			text += JSON.stringify(req[list[i]]) + "\n";
		// 			obj[list[i]] = req[list[i]];
		// 		} catch {}
		// 	}
		// 	reqs[req._requestId] = obj;
		// 	fs.writeFileSync("requests\\reqs.json", JSON.stringify(reqs, null, "\t"));
		// 	// fs.writeFileSync("requests\\" + req._requestId, text);
		// 	req.continue();
		// });

		fechar(options, page);

		while (true) {
			await log("Redirecionando...", page);
			await page.goto(url);

			var logged;
			await log("Verificando Login...", page);
			await browser.waitForTarget(function(target) {
				logged = target.url().includes("https://meet.google.com/" + options.link);
				return target.url().includes("https://meet.google.com/" + options.link) || target.url().includes(url);
			});

			if (logged) {
				await log("Email Existente", page);
				logged = await page.evaluate(function(options) {
					var l = true;
					if (document.querySelector(".ASy21.Duq0Bf").innerText != options.email) {
						l = false;
					}
					return l;
				}, options);
				if (!logged) {
					await log("Email Incorreto", page);
					await log("Fazendo Logoff...", page);
					await page.goto(url2);
					await page.waitForSelector(".BHzsHc")
					await page.click(".BHzsHc");
					await page.waitForTimeout(2000);
				}
			}

			if (!logged) {
				await log("Fazendo Login...", page);
				await page.waitForSelector('input[type="email"]');
				await page.waitForSelector("#identifierNext");
				await log("Digitando Email...", page);
				await page.type('input[type="email"]', options.email, {delay: 120.24});
				await page.waitForSelector("#identifierNext");
				await page.click("#identifierNext");

				await page.waitForTimeout(2000);
				await page.waitForSelector('input[type="password"]');
				await page.waitForSelector("#passwordNext");
				await log("Digitando Senha...", page);
				//document.querySelector(".OyEIQ.uSvLId").innerText == "Senha incorreta. Tente novamente ou clique em \"Esqueceu a senha?\" para redefini-la.";
				await page.type('input[type="password"]', options.senha, {delay: 112.47});
				await page.waitForSelector("#passwordNext");
				await page.click("#passwordNext");

				await browser.waitForTarget(function(target) {
					return target.url().includes("https://meet.google.com/" + options.link);
				});
			}
			await page.waitForFunction(function() {
				try {
					return document.querySelector(".uArJ5e.UQuaGc.Y5sE8d.uyXBBb.xKiqt").clientHeight > 0;
				} catch {}
			})

			await page.waitForSelector(".GKGgdd");
			await page.keyboard.down("ControlLeft");
			await log("Desligando Microfone...", page);
			await page.keyboard.press("KeyD");
			await log("Desligando Câmera...", page);
			await page.keyboard.press("KeyE");
			await page.keyboard.up("ControlLeft");

			await page.click(".uArJ5e.UQuaGc.Y5sE8d.uyXBBb.xKiqt");

			await log("Aguardando Permissão...", page);
			var per = await page.evaluate(async function() {
				return new Promise(function(resolve) {
					function run() {
						try {
							var dh = document.querySelector(".dHFSie");
							if (dh) {
								if (dh.innerText == "Não é possível participar desta chamada") {
									return resolve(false);
								}
							}
							var rv = document.querySelector(".RveJvd.snByac");
							if (rv) {
								if (rv.innerText == "Participar agora") {
									rv.click();
								}
							}
							var rg = document.querySelector(".rG0ybd.LCXT6");
							if (rg) {
								return resolve(true);
							}
							setTimeout(run, 1000);
						} catch {
							setTimeout(run, 1000);
						}
					}
					run();
				});
			});

			if (per) {
				await log("Permissão Concedida", page);

				var black = await page.evaluate(function() {
					return document.getElementsByClassName("rG0ybd LCXT6")[0].className == "rG0ybd xPh1xb P9KVBf LCXT6";
				});

				if (black) {
					await log("Tema Novo em uso", page);
				} else {
					await log("Tema Antigo em uso", page);
				}

				per = await page.evaluate(async function() {
					return new Promise(function(resolve) {
						function run() {
						try {
							var ro = document.querySelector(".roSPhc");
							if (ro) {
								if (ro.innerText == "Alguém removeu você da reunião" || ro.innerText == "Seu organizador encerrou a reunião para todos") {
									return resolve(false);
								}
							}
							setTimeout(run, 1000);
						} catch {
							setTimeout(run, 1000);
						}
					}
					run();
					});
				});
			}
			if (!per) {
				await log("Permissão Negada", page);
			}
		}

		// await log("Esperando 10 Segundos...");
		// setTimeout(async function() {
		// 	await log("Fechando Browser...");
		// 	browser.close();
		// }, 10000);
	} catch (e) {
		console.log(e);
		browser.close();
	}
}

iniciar({
	link: "wnu-xqnh-xir",
	email: "20100092@educargloria.com",
	senha: "educar1234#",
	dias: [1, 2, 3, 4, 5],
	inicio: {
		horas: 12,
		minutos: 55
	},
	fim: {
		horas: 17,
		minutos: 30
	}
});
