/* Respond.js: min/max-width media query polyfill. (c) Scott Jehl. MIT Lic. j.mp/respondjs  */
/* Respond.js: polyfill de consulta de mídia de largura mínima/máxima. (c) Scott Jehl. MIT Lic. j.mp/respondjs */
(function(w) {

    "use strict";

    //exposed namespace/nome exposto-espaço
    var respond = {};
    w.respond = respond;

    //define update even in native-mq-supporting browsers, to avoid errors
    //definir atualização mesmo em navegadores com suporte nativo-mq, para evitar erros
    respond.update = function() {};

    //define ajax obj
    var requestQueue = [],
        xmlHttp = (function() {
            var xmlhttpmethod = false;
            try {
                xmlhttpmethod = new w.XMLHttpRequest();
            } catch (e) {
                xmlhttpmethod = new w.ActiveXObject("Microsoft.XMLHTTP");
            }
            return function() {
                return xmlhttpmethod;
            };
        })(),

        //tweaked Ajax functions from Quirksmode/Funções ajax ajustadas
        ajax = function(url, callback) {
            var req = xmlHttp();
            if (!req) {
                return;
            }
            req.open("GET", url, true);
            req.onreadystatechange = function() {
                if (req.readyState !== 4 || req.status !== 200 && req.status !== 304) {
                    return;
                }
                callback(req.responseText);
            };
            if (req.readyState === 4) {
                return;
            }
            req.send(null);
        },
        isUnsupportedMediaQuery = function(query) {
            return query.replace(respond.regex.minmaxwh, '').match(respond.regex.other);
        };

    //expose for testing/testes expostos
    respond.ajax = ajax;
    respond.queue = requestQueue;
    respond.unsupportedmq = isUnsupportedMediaQuery;
    respond.regex = {
        media: /@media[^\{]+\{([^\{\}]*\{[^\}\{]*\})+/gi,
        keyframes: /@(?:\-(?:o|moz|webkit)\-)?keyframes[^\{]+\{(?:[^\{\}]*\{[^\}\{]*\})+[^\}]*\}/gi,
        comments: /\/\*[^*]*\*+([^/][^*]*\*+)*\//gi,
        urls: /(url\()['"]?([^\/\)'"][^:\)'"]+)['"]?(\))/g,
        findStyles: /@media *([^\{]+)\{([\S\s]+?)$/,
        only: /(only\s+)?([a-zA-Z]+)\s?/,
        minw: /\(\s*min\-width\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/,
        maxw: /\(\s*max\-width\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/,
        minmaxwh: /\(\s*m(in|ax)\-(height|width)\s*:\s*(\s*[0-9\.]+)(px|em)\s*\)/gi,
        other: /\([^\)]*\)/g
    };

    //expose media query support flag for external use
    //expõe sinalizador de suporte de consulta de mídia para uso externo
    respond.mediaQueriesSupported = w.matchMedia && w.matchMedia("only all") !== null && w.matchMedia("only all").matches;

    //if media queries are supported, exit here
    //se as consultas de mídia forem suportadas, saia aqui
    if (respond.mediaQueriesSupported) {
        return;
    }

    //define vars/define vars
    var doc = w.document,
        docElem = doc.documentElement,
        mediastyles = [],
        rules = [],
        appendedEls = [],
        parsedSheets = {},
        resizeThrottle = 30,
        head = doc.getElementsByTagName("head")[0] || docElem,
        base = doc.getElementsByTagName("base")[0],
        links = head.getElementsByTagName("link"),

        lastCall,
        resizeDefer,

        //cached container for 1em value, populated the first time it's needed   
        //contêiner em cache para o valor 1em, preenchido na primeira vez que for necessário
        eminpx,

        // returns the value of 1em in pixels
        // retorna o valor de 1em em pixels
        getEmValue = function() {
            var ret,
                div = doc.createElement('div'),
                body = doc.body,
                originalHTMLFontSize = docElem.style.fontSize,
                originalBodyFontSize = body && body.style.fontSize,
                fakeUsed = false;

            div.style.cssText = "position:absolute;font-size:1em;width:1em";

            if (!body) {
                body = fakeUsed = doc.createElement("body");
                body.style.background = "none";
            }

            // 1em in a media query is the value of the default font size of the browser
            // reset docElem and body to ensure the correct value is returned
            // 1em em uma media query é o valor do tamanho da fonte padrão do navegador
            // redefine o docElem e o corpo para garantir que o valor correto seja retornado
            docElem.style.fontSize = "100%";
            body.style.fontSize = "100%";

            body.appendChild(div);

            if (fakeUsed) {
                docElem.insertBefore(body, docElem.firstChild);
            }

            ret = div.offsetWidth;

            if (fakeUsed) {
                docElem.removeChild(body);
            } else {
                body.removeChild(div);
            }

            // restore the original values/restaurar os valores originais
            docElem.style.fontSize = originalHTMLFontSize;
            if (originalBodyFontSize) {
                body.style.fontSize = originalBodyFontSize;
            }


            //also update eminpx before returning/também atualize o eminpx antes de retornar
            ret = eminpx = parseFloat(ret);

            return ret;
        },

        //enable/disable styles/ativar/desativar estilos
        applyMedia = function(fromResize) {
            var name = "clientWidth",
                docElemProp = docElem[name],
                currWidth = doc.compatMode === "CSS1Compat" && docElemProp || doc.body[name] || docElemProp,
                styleBlocks = {},
                lastLink = links[links.length - 1],
                now = (new Date()).getTime();

            //throttle resize calls/acelerar redimensionar chamadas
            if (fromResize && lastCall && now - lastCall < resizeThrottle) {
                w.clearTimeout(resizeDefer);
                resizeDefer = w.setTimeout(applyMedia, resizeThrottle);
                return;
            } else {
                lastCall = now;
            }

            for (var i in mediastyles) {
                if (mediastyles.hasOwnProperty(i)) {
                    var thisstyle = mediastyles[i],
                        min = thisstyle.minw,
                        max = thisstyle.maxw,
                        minnull = min === null,
                        maxnull = max === null,
                        em = "em";

                    if (!!min) {
                        min = parseFloat(min) * (min.indexOf(em) > -1 ? (eminpx || getEmValue()) : 1);
                    }
                    if (!!max) {
                        max = parseFloat(max) * (max.indexOf(em) > -1 ? (eminpx || getEmValue()) : 1);
                    }

                    // if there's no media query at all (the () part), or min or max is not null, and if either is present, they're true                 
                    // se não houver nenhuma consulta de mídia (a parte ()), ou min ou max não for nulo, e se algum estiver presente, eles são verdadeiros
                    if (!thisstyle.hasquery || (!minnull || !maxnull) && (minnull || currWidth >= min) && (maxnull || currWidth <= max)) {
                        if (!styleBlocks[thisstyle.media]) {
                            styleBlocks[thisstyle.media] = [];
                        }
                        styleBlocks[thisstyle.media].push(rules[thisstyle.rules]);
                    }
                }
            }

            //remove any existing respond style element(s)
            //remove qualquer elemento(s) de estilo de resposta existente

            for (var j in appendedEls) {
                if (appendedEls.hasOwnProperty(j)) {
                    if (appendedEls[j] && appendedEls[j].parentNode === head) {
                        head.removeChild(appendedEls[j]);
                    }
                }
            }
            appendedEls.length = 0;

            //inject active styles, grouped by media type         
            //injeta estilos ativos, agrupados por tipo de mídia
            for (var k in styleBlocks) {
                if (styleBlocks.hasOwnProperty(k)) {
                    var ss = doc.createElement("style"),
                        css = styleBlocks[k].join("\n");

                    ss.type = "text/css";
                    ss.media = k;

                    //originally, ss was appended to a documentFragment and sheets were appended in bulk.
                    //this caused crashes in IE in a number of circumstances, such as when the HTML element had a bg image set, so appending beforehand seems best. Thanks to @dvelyk for the initial research on this one!
                    //originalmente, ss foi anexado a um documentFragment e as folhas foram anexadas em massa.
                    //isso causou travamentos no IE em várias circunstâncias, como quando o elemento HTML tinha uma imagem bg definida, então anexar antes parece melhor. Obrigado a dvelyk pela pesquisa inicial sobre este!
                    head.insertBefore(ss, lastLink.nextSibling);

                    if (ss.styleSheet) {
                        ss.styleSheet.cssText = css;
                    } else {
                        ss.appendChild(doc.createTextNode(css));
                    }

                    //push to appendedEls to track for later removal
                    //enviar para appendedEls para rastrear para remoção posterior
                    appendedEls.push(ss);
                }
            }
        },
        //find media blocks in css text, convert to style blocks
        //encontra blocos de mídia em texto css, converte em blocos de estilo
        translate = function(styles, href, media) {
            var qs = styles.replace(respond.regex.comments, '')
                .replace(respond.regex.keyframes, '')
                .match(respond.regex.media),
                ql = qs && qs.length || 0;

            //try to get CSS path/ tenta pegar o caminho CSS
            href = href.substring(0, href.lastIndexOf("/"));

            var repUrls = function(css) {
                    return css.replace(respond.regex.urls, "$1" + href + "$2$3");
                },
                useMedia = !ql && media;

            //if path exists, tack on trailing slash/se o caminho existir, coloque na barra final
            if (href.length) { href += "/"; }

            //if no internal queries exist, but media attr does, use that
            //note: this currently lacks support for situations where a media attr is specified on a link AND
            //its associated stylesheet has internal CSS media queries.
            //In those cases, the media attribute will currently be ignored.
            //se não existirem consultas internas, mas o media attr existir, use isso
            //nota: atualmente não há suporte para situações em que um attr de mídia é especificado em um link E
            //sua folha de estilo associada possui consultas de mídia CSS internas.
            //Nesses casos, o atributo de mídia será ignorado no momento.
            if (useMedia) {
                ql = 1;
            }

            for (var i = 0; i < ql; i++) {
                var fullq, thisq, eachq, eql;

                //media attr/Atração de mídia
                if (useMedia) {
                    fullq = media;
                    rules.push(repUrls(styles));
                }
                //parse for styles/analisar estilos
                else {
                    fullq = qs[i].match(respond.regex.findStyles) && RegExp.$1;
                    rules.push(RegExp.$2 && repUrls(RegExp.$2));
                }

                eachq = fullq.split(",");
                eql = eachq.length;

                for (var j = 0; j < eql; j++) {
                    thisq = eachq[j];

                    if (isUnsupportedMediaQuery(thisq)) {
                        continue;
                    }

                    mediastyles.push({
                        media: thisq.split("(")[0].match(respond.regex.only) && RegExp.$2 || "all",
                        rules: rules.length - 1,
                        hasquery: thisq.indexOf("(") > -1,
                        minw: thisq.match(respond.regex.minw) && parseFloat(RegExp.$1) + (RegExp.$2 || ""),
                        maxw: thisq.match(respond.regex.maxw) && parseFloat(RegExp.$1) + (RegExp.$2 || "")
                    });
                }
            }

            applyMedia();
        },

        //recurse through request queue, get css text
        //recorre através da fila de requisições, obtém texto css
        makeRequests = function() {
            if (requestQueue.length) {
                var thisRequest = requestQueue.shift();

                ajax(thisRequest.href, function(styles) {
                    translate(styles, thisRequest.href, thisRequest.media);
                    parsedSheets[thisRequest.href] = true;

                    // by wrapping recursive function call in setTimeout
                    // we prevent "Stack overflow" error in IE7
                    // envolvendo a chamada de função recursiva em setTimeout
                    // prevenimos o erro "Stack overflow" no IE7
                    w.setTimeout(function() { makeRequests(); }, 0);
                });
            }
        },

        //loop stylesheets, send text content to translate
        //loop folhas de estilo, envia conteúdo de texto para traduzir
        ripCSS = function() {

            for (var i = 0; i < links.length; i++) {
                var sheet = links[i],
                    href = sheet.href,
                    media = sheet.media,
                    isCSS = sheet.rel && sheet.rel.toLowerCase() === "stylesheet";

                //only links plz and prevent re-parsing
                //somente links plz e evita re-analisar
                if (!!href && isCSS && !parsedSheets[href]) {
                    // selectivizr exposes css through the rawCssText expando
                    // selectivizr expõe css através do rawCssText expando
                    if (sheet.styleSheet && sheet.styleSheet.rawCssText) {
                        translate(sheet.styleSheet.rawCssText, href, media);
                        parsedSheets[href] = true;
                    } else {
                        if ((!/^([a-zA-Z:]*\/\/)/.test(href) && !base) ||
                            href.replace(RegExp.$1, "").split("/")[0] === w.location.host) {
                            // IE7 doesn't handle urls that start with '//' for ajax request
                            // manually add in the protocol
                            // IE7 não lida com urls que começam com '//' para requisição ajax
                            // adiciona manualmente no protocolo
                            if (href.substring(0, 2) === "//") { href = w.location.protocol + href; }
                            requestQueue.push({
                                href: href,
                                media: media
                            });
                        }
                    }
                }
            }
            makeRequests();
        };

    //translate CSS/tradução de css
    ripCSS();

    //expose update for re-running respond later on
    //expõe atualização para reexecução responde mais tarde
    respond.update = ripCSS;

    //expose getEmValue
    //expõe getEmValue
    respond.getEmValue = getEmValue;

    //adjust on resize
    //ajusta no redimensionamento
    function callMedia() {
        applyMedia(true);
    }

    if (w.addEventListener) {
        w.addEventListener("resize", callMedia, false);
    } else if (w.attachEvent) {
        w.attachEvent("onresize", callMedia);
    }
})(this);