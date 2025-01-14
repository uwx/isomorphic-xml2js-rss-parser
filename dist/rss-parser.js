(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["RSSParser"] = factory();
	else
		root["RSSParser"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./index.js":
/*!******************!*\
  !*** ./index.js ***!
  \******************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = __webpack_require__(/*! ./lib/parser */ "./lib/parser.js");

/***/ }),

/***/ "./lib/fields.js":
/*!***********************!*\
  !*** ./lib/fields.js ***!
  \***********************/
/***/ ((module) => {

var fields = module.exports = {};
fields.feed = [['author', 'creator'], ['dc:publisher', 'publisher'], ['dc:creator', 'creator'], ['dc:source', 'source'], ['dc:title', 'title'], ['dc:type', 'type'], 'title', 'description', 'author', 'pubDate', 'webMaster', 'managingEditor', 'generator', 'link', 'language', 'copyright', 'lastBuildDate', 'docs', 'generator', 'ttl', 'rating', 'skipHours', 'skipDays'];
fields.item = [['author', 'creator'], ['dc:creator', 'creator'], ['dc:date', 'date'], ['dc:language', 'language'], ['dc:rights', 'rights'], ['dc:source', 'source'], ['dc:title', 'title'], 'title', 'link', 'pubDate', 'author', 'summary', ['content:encoded', 'content:encoded', {
  includeSnippet: true
}], 'enclosure', 'dc:creator', 'dc:date', 'comments'];
var mapItunesField = function mapItunesField(f) {
  return ['itunes:' + f, f];
};
fields.podcastFeed = ['author', 'subtitle', 'summary', 'explicit'].map(mapItunesField);
fields.podcastItem = ['author', 'subtitle', 'summary', 'explicit', 'duration', 'image', 'episode', 'image', 'season', 'keywords', 'episodeType'].map(mapItunesField);

/***/ }),

/***/ "./lib/parser.js":
/*!***********************!*\
  !*** ./lib/parser.js ***!
  \***********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var http = __webpack_require__(/*! http */ "?4dd1");
var https = __webpack_require__(/*! https */ "?2a16");
var xml2js = __webpack_require__(/*! isomorphic-xml2js */ "./node_modules/.pnpm/isomorphic-xml2js@0.1.3/node_modules/isomorphic-xml2js/dist/lib/browser.js");
var url = __webpack_require__(/*! url */ "?32c8");
var fields = __webpack_require__(/*! ./fields */ "./lib/fields.js");
var utils = __webpack_require__(/*! ./utils */ "./lib/utils.js");
var DEFAULT_HEADERS = {
  'User-Agent': 'rss-parser',
  'Accept': 'application/rss+xml'
};
var DEFAULT_MAX_REDIRECTS = 5;
var DEFAULT_TIMEOUT = 60000;
var Parser = /*#__PURE__*/function () {
  function Parser() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    _classCallCheck(this, Parser);
    options.headers = options.headers || {};
    options.xml2js = options.xml2js || {};
    options.customFields = options.customFields || {};
    options.customFields.item = options.customFields.item || [];
    options.customFields.feed = options.customFields.feed || [];
    options.requestOptions = options.requestOptions || {};
    if (!options.maxRedirects) options.maxRedirects = DEFAULT_MAX_REDIRECTS;
    if (!options.timeout) options.timeout = DEFAULT_TIMEOUT;
    this.options = options;
    this.xmlParser = new xml2js.Parser(this.options.xml2js);
    this.etags = {};
    this.lastModified = {};
  }
  return _createClass(Parser, [{
    key: "parseString",
    value: function parseString(xml, callback) {
      var _this = this;
      var prom = new Promise(function (resolve, reject) {
        _this.xmlParser.parseString(xml, function (err, result) {
          if (err) return reject(err);
          if (!result) {
            return reject(new Error('Unable to parse XML.'));
          }
          var feed = null;
          if (result.feed) {
            feed = _this.buildAtomFeed(result);
          } else if (result.rss && result.rss.$ && result.rss.$.version && result.rss.$.version.match(/^2/)) {
            feed = _this.buildRSS2(result);
          } else if (result['rdf:RDF']) {
            feed = _this.buildRSS1(result);
          } else if (result.rss && result.rss.$ && result.rss.$.version && result.rss.$.version.match(/0\.9/)) {
            feed = _this.buildRSS0_9(result);
          } else if (result.rss && _this.options.defaultRSS) {
            switch (_this.options.defaultRSS) {
              case 0.9:
                feed = _this.buildRSS0_9(result);
                break;
              case 1:
                feed = _this.buildRSS1(result);
                break;
              case 2:
                feed = _this.buildRSS2(result);
                break;
              default:
                return reject(new Error("default RSS version not recognized."));
            }
          } else {
            return reject(new Error("Feed not recognized as RSS 1 or 2."));
          }
          resolve(feed);
        });
      });
      prom = utils.maybePromisify(callback, prom);
      return prom;
    }
  }, {
    key: "parseURL",
    value: function parseURL(feedUrl, callback) {
      var _this2 = this;
      var redirectCount = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var xml = '';
      var get = feedUrl.indexOf('https') === 0 ? https.get : http.get;
      var urlParts = url.parse(feedUrl);
      var headers = Object.assign({}, DEFAULT_HEADERS, this.options.headers);
      if (this.etags[feedUrl]) {
        headers['If-None-Match'] = this.etags[feedUrl];
      }
      if (this.lastModified[feedUrl]) {
        headers['If-Modified-Since'] = this.lastModified[feedUrl];
      }
      var timeout = null;
      var prom = new Promise(function (resolve, reject) {
        var requestOpts = Object.assign({
          headers: headers
        }, urlParts, _this2.options.requestOptions);
        var req = get(requestOpts, function (res) {
          if (_this2.options.maxRedirects && res.statusCode >= 300 && res.statusCode < 400 && res.headers['location']) {
            if (redirectCount === _this2.options.maxRedirects) {
              return reject(new Error("Too many redirects"));
            } else {
              var newLocation = url.resolve(feedUrl, res.headers['location']);
              return _this2.parseURL(newLocation, null, redirectCount + 1).then(resolve, reject);
            }
          } else if (res.statusCode === 304) {
            return resolve(null);
          } else if (res.statusCode >= 300) {
            return reject(new Error("Status code " + res.statusCode));
          }
          if (res.headers['etag']) {
            _this2.etags[feedUrl] = res.headers['etag'];
          }
          if (res.headers['last-modified']) {
            _this2.lastModified[feedUrl] = res.headers['last-modified'];
          }
          var encoding = utils.getEncodingFromContentType(res.headers['content-type']);
          res.setEncoding(encoding);
          res.on('data', function (chunk) {
            xml += chunk;
          });
          res.on('end', function () {
            return _this2.parseString(xml).then(resolve, reject);
          });
        });
        req.on('error', reject);
        timeout = setTimeout(function () {
          var err = new Error("Request timed out after " + _this2.options.timeout + "ms");
          req.destroy(err);
          reject(err);
        }, _this2.options.timeout);
      }).then(function (data) {
        clearTimeout(timeout);
        return Promise.resolve(data);
      }, function (e) {
        clearTimeout(timeout);
        return Promise.reject(e);
      });
      prom = utils.maybePromisify(callback, prom);
      return prom;
    }
  }, {
    key: "buildAtomFeed",
    value: function buildAtomFeed(xmlObj) {
      var _this3 = this;
      var feed = {
        items: []
      };
      utils.copyFromXML(xmlObj.feed, feed, this.options.customFields.feed);
      if (xmlObj.feed.link) {
        feed.link = utils.getLink(xmlObj.feed.link, 'alternate', 0);
        feed.feedUrl = utils.getLink(xmlObj.feed.link, 'self', 1);
      }
      if (xmlObj.feed.title) {
        var title = xmlObj.feed.title[0] || '';
        if (title._) title = title._;
        if (title) feed.title = title;
      }
      if (xmlObj.feed.updated) {
        feed.lastBuildDate = xmlObj.feed.updated[0];
      }
      feed.items = (xmlObj.feed.entry || []).map(function (entry) {
        return _this3.parseItemAtom(entry);
      });
      return feed;
    }
  }, {
    key: "parseItemAtom",
    value: function parseItemAtom(entry) {
      var item = {};
      utils.copyFromXML(entry, item, this.options.customFields.item);
      if (entry.title) {
        var title = entry.title[0] || '';
        if (title._) title = title._;
        if (title) item.title = title;
      }
      if (entry.link && entry.link.length) {
        item.link = utils.getLink(entry.link, 'alternate', 0);
      }
      if (entry.published && entry.published.length && entry.published[0].length) item.pubDate = new Date(entry.published[0]).toISOString();
      if (!item.pubDate && entry.updated && entry.updated.length && entry.updated[0].length) item.pubDate = new Date(entry.updated[0]).toISOString();
      if (entry.author && entry.author.length && entry.author[0].name && entry.author[0].name.length) item.author = entry.author[0].name[0];
      if (entry.content && entry.content.length) {
        item.content = utils.getContent(entry.content[0]);
        item.contentSnippet = utils.getSnippet(item.content);
      }
      if (entry.summary && entry.summary.length) {
        item.summary = utils.getContent(entry.summary[0]);
      }
      if (entry.id) {
        item.id = entry.id[0];
      }
      this.setISODate(item);
      return item;
    }
  }, {
    key: "buildRSS0_9",
    value: function buildRSS0_9(xmlObj) {
      var channel = xmlObj.rss.channel[0];
      var items = channel.item;
      return this.buildRSS(channel, items);
    }
  }, {
    key: "buildRSS1",
    value: function buildRSS1(xmlObj) {
      xmlObj = xmlObj['rdf:RDF'];
      var channel = xmlObj.channel[0];
      var items = xmlObj.item;
      return this.buildRSS(channel, items);
    }
  }, {
    key: "buildRSS2",
    value: function buildRSS2(xmlObj) {
      var channel = xmlObj.rss.channel[0];
      var items = channel.item;
      var feed = this.buildRSS(channel, items);
      if (xmlObj.rss.$ && xmlObj.rss.$['xmlns:itunes']) {
        this.decorateItunes(feed, channel);
      }
      return feed;
    }
  }, {
    key: "buildRSS",
    value: function buildRSS(channel, items) {
      var _this4 = this;
      items = items || [];
      var feed = {
        items: []
      };
      var feedFields = fields.feed.concat(this.options.customFields.feed);
      var itemFields = fields.item.concat(this.options.customFields.item);
      if (channel['atom:link'] && channel['atom:link'][0] && channel['atom:link'][0].$) {
        feed.feedUrl = channel['atom:link'][0].$.href;
      }
      if (channel.image && channel.image[0] && channel.image[0].url) {
        feed.image = {};
        var image = channel.image[0];
        if (image.link) feed.image.link = image.link[0];
        if (image.url) feed.image.url = image.url[0];
        if (image.title) feed.image.title = image.title[0];
        if (image.width) feed.image.width = image.width[0];
        if (image.height) feed.image.height = image.height[0];
      }
      var paginationLinks = this.generatePaginationLinks(channel);
      if (Object.keys(paginationLinks).length) {
        feed.paginationLinks = paginationLinks;
      }
      utils.copyFromXML(channel, feed, feedFields);
      feed.items = items.map(function (xmlItem) {
        return _this4.parseItemRss(xmlItem, itemFields);
      });
      return feed;
    }
  }, {
    key: "parseItemRss",
    value: function parseItemRss(xmlItem, itemFields) {
      var _xmlItem$mediaConten, _xmlItem$mediaConten2;
      var item = {};
      utils.copyFromXML(xmlItem, item, itemFields);
      if (xmlItem.enclosure) {
        item.enclosure = xmlItem.enclosure[0].$;
      }
      if (xmlItem.description) {
        item.content = utils.getContent(xmlItem.description[0]);
        item.contentSnippet = utils.getSnippet(item.content);
      }
      if (xmlItem.guid) {
        item.guid = xmlItem.guid[0];
        if (item.guid._) item.guid = item.guid._;
      }
      if (xmlItem.$ && xmlItem.$['rdf:about']) {
        item['rdf:about'] = xmlItem.$['rdf:about'];
      }
      if (xmlItem.category) item.categories = xmlItem.category;
      var mediaContent = (_xmlItem$mediaConten = (_xmlItem$mediaConten2 = xmlItem['media:content']) === null || _xmlItem$mediaConten2 === void 0 || (_xmlItem$mediaConten2 = _xmlItem$mediaConten2[0]) === null || _xmlItem$mediaConten2 === void 0 ? void 0 : _xmlItem$mediaConten2.$) !== null && _xmlItem$mediaConten !== void 0 ? _xmlItem$mediaConten : null;
      if (mediaContent) item.mediaContent = mediaContent;
      this.setISODate(item);
      return item;
    }

    /**
     * Add iTunes specific fields from XML to extracted JSON
     *
     * @access public
     * @param {object} feed extracted
     * @param {object} channel parsed XML
     */
  }, {
    key: "decorateItunes",
    value: function decorateItunes(feed, channel) {
      var items = channel.item || [];
      var categories = [];
      feed.itunes = {};
      if (channel['itunes:owner']) {
        var owner = {};
        if (channel['itunes:owner'][0]['itunes:name']) {
          owner.name = channel['itunes:owner'][0]['itunes:name'][0];
        }
        if (channel['itunes:owner'][0]['itunes:email']) {
          owner.email = channel['itunes:owner'][0]['itunes:email'][0];
        }
        feed.itunes.owner = owner;
      }
      if (channel['itunes:image']) {
        var image;
        var hasImageHref = channel['itunes:image'][0] && channel['itunes:image'][0].$ && channel['itunes:image'][0].$.href;
        image = hasImageHref ? channel['itunes:image'][0].$.href : null;
        if (image) {
          feed.itunes.image = image;
        }
      }
      if (channel['itunes:category']) {
        var categoriesWithSubs = channel['itunes:category'].map(function (category) {
          return {
            name: category && category.$ && category.$.text,
            subs: category['itunes:category'] ? category['itunes:category'].map(function (subcategory) {
              return {
                name: subcategory && subcategory.$ && subcategory.$.text
              };
            }) : null
          };
        });
        feed.itunes.categories = categoriesWithSubs.map(function (category) {
          return category.name;
        });
        feed.itunes.categoriesWithSubs = categoriesWithSubs;
      }
      if (channel['itunes:keywords']) {
        if (channel['itunes:keywords'].length > 1) {
          feed.itunes.keywords = channel['itunes:keywords'].map(function (keyword) {
            return keyword && keyword.$ && keyword.$.text;
          });
        } else {
          var keywords = channel['itunes:keywords'][0];
          if (keywords && typeof keywords._ === 'string') {
            keywords = keywords._;
          }
          if (keywords && keywords.$ && keywords.$.text) {
            feed.itunes.keywords = keywords.$.text.split(',');
          } else if (typeof keywords === "string") {
            feed.itunes.keywords = keywords.split(',');
          }
        }
      }
      utils.copyFromXML(channel, feed.itunes, fields.podcastFeed);
      items.forEach(function (item, index) {
        var entry = feed.items[index];
        entry.itunes = {};
        utils.copyFromXML(item, entry.itunes, fields.podcastItem);
        var image = item['itunes:image'];
        if (image && image[0] && image[0].$ && image[0].$.href) {
          entry.itunes.image = image[0].$.href;
        }
      });
    }
  }, {
    key: "setISODate",
    value: function setISODate(item) {
      var date = item.pubDate || item.date;
      if (date) {
        try {
          item.isoDate = new Date(date.trim()).toISOString();
        } catch (e) {
          // Ignore bad date format
        }
      }
    }

    /**
     * Generates a pagination object where the rel attribute is the key and href attribute is the value
     *  { self: 'self-url', first: 'first-url', ...  }
     *
     * @access private
     * @param {Object} channel parsed XML
     * @returns {Object}
     */
  }, {
    key: "generatePaginationLinks",
    value: function generatePaginationLinks(channel) {
      if (!channel['atom:link']) {
        return {};
      }
      var paginationRelAttributes = ['self', 'first', 'next', 'prev', 'last'];
      return channel['atom:link'].reduce(function (paginationLinks, link) {
        if (!link.$ || !paginationRelAttributes.includes(link.$.rel)) {
          return paginationLinks;
        }
        paginationLinks[link.$.rel] = link.$.href;
        return paginationLinks;
      }, {});
    }
  }]);
}();
module.exports = Parser;

/***/ }),

/***/ "./lib/utils.js":
/*!**********************!*\
  !*** ./lib/utils.js ***!
  \**********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var utils = module.exports = {};
var entities = __webpack_require__(/*! entities */ "./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/index.js");
var xml2js = __webpack_require__(/*! isomorphic-xml2js */ "./node_modules/.pnpm/isomorphic-xml2js@0.1.3/node_modules/isomorphic-xml2js/dist/lib/browser.js");
utils.stripHtml = function (str) {
  str = str.replace(/([^\n])<\/?(h|br|p|ul|ol|li|blockquote|section|table|tr|div)(?:.|\n)*?>([^\n])/gm, '$1\n$3');
  str = str.replace(/<(?:.|\n)*?>/gm, '');
  return str;
};
utils.getSnippet = function (str) {
  return entities.decodeHTML(utils.stripHtml(str)).trim();
};
utils.getLink = function (links, rel, fallbackIdx) {
  if (!links) return;
  for (var i = 0; i < links.length; ++i) {
    if (links[i].$.rel === rel) return links[i].$.href;
  }
  if (links[fallbackIdx]) return links[fallbackIdx].$.href;
};
utils.getContent = function (content) {
  if (typeof content._ === 'string') {
    return content._;
  } else if (_typeof(content) === 'object') {
    var builder = new xml2js.Builder({
      headless: true,
      explicitRoot: true,
      rootName: 'div',
      renderOpts: {
        pretty: false
      }
    });
    return builder.buildObject(content);
  } else {
    return content;
  }
};
utils.copyFromXML = function (xml, dest, fields) {
  fields.forEach(function (f) {
    var from = f;
    var to = f;
    var options = {};
    if (Array.isArray(f)) {
      from = f[0];
      to = f[1];
      if (f.length > 2) {
        options = f[2];
      }
    }
    var _options = options,
      keepArray = _options.keepArray,
      includeSnippet = _options.includeSnippet;
    if (xml[from] !== undefined) {
      dest[to] = keepArray ? xml[from] : xml[from][0];
    }
    if (dest[to] && typeof dest[to]._ === 'string') {
      dest[to] = dest[to]._;
    }
    if (includeSnippet && dest[to] && typeof dest[to] === 'string') {
      dest[to + 'Snippet'] = utils.getSnippet(dest[to]);
    }
  });
};
utils.maybePromisify = function (callback, promise) {
  if (!callback) return promise;
  return promise.then(function (data) {
    return setTimeout(function () {
      return callback(null, data);
    });
  }, function (err) {
    return setTimeout(function () {
      return callback(err);
    });
  });
};
var DEFAULT_ENCODING = 'utf8';
var ENCODING_REGEX = /(encoding|charset)\s*=\s*(\S+)/;
var SUPPORTED_ENCODINGS = ['ascii', 'utf8', 'utf16le', 'ucs2', 'base64', 'latin1', 'binary', 'hex'];
var ENCODING_ALIASES = {
  'utf-8': 'utf8',
  'iso-8859-1': 'latin1'
};
utils.getEncodingFromContentType = function (contentType) {
  contentType = contentType || '';
  var match = contentType.match(ENCODING_REGEX);
  var encoding = (match || [])[2] || '';
  encoding = encoding.toLowerCase();
  encoding = ENCODING_ALIASES[encoding] || encoding;
  if (!encoding || SUPPORTED_ENCODINGS.indexOf(encoding) === -1) {
    encoding = DEFAULT_ENCODING;
  }
  return encoding;
};

/***/ }),

/***/ "./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/decode.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/decode.js ***!
  \*******************************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.decodeHTML = exports.decodeHTMLStrict = exports.decodeXML = void 0;
var entities_json_1 = __importDefault(__webpack_require__(/*! ./maps/entities.json */ "./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/maps/entities.json"));
var legacy_json_1 = __importDefault(__webpack_require__(/*! ./maps/legacy.json */ "./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/maps/legacy.json"));
var xml_json_1 = __importDefault(__webpack_require__(/*! ./maps/xml.json */ "./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/maps/xml.json"));
var decode_codepoint_1 = __importDefault(__webpack_require__(/*! ./decode_codepoint */ "./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/decode_codepoint.js"));
var strictEntityRe = /&(?:[a-zA-Z0-9]+|#[xX][\da-fA-F]+|#\d+);/g;
exports.decodeXML = getStrictDecoder(xml_json_1["default"]);
exports.decodeHTMLStrict = getStrictDecoder(entities_json_1["default"]);
function getStrictDecoder(map) {
  var replace = getReplacer(map);
  return function (str) {
    return String(str).replace(strictEntityRe, replace);
  };
}
var sorter = function sorter(a, b) {
  return a < b ? 1 : -1;
};
exports.decodeHTML = function () {
  var legacy = Object.keys(legacy_json_1["default"]).sort(sorter);
  var keys = Object.keys(entities_json_1["default"]).sort(sorter);
  for (var i = 0, j = 0; i < keys.length; i++) {
    if (legacy[j] === keys[i]) {
      keys[i] += ";?";
      j++;
    } else {
      keys[i] += ";";
    }
  }
  var re = new RegExp("&(?:" + keys.join("|") + "|#[xX][\\da-fA-F]+;?|#\\d+;?)", "g");
  var replace = getReplacer(entities_json_1["default"]);
  function replacer(str) {
    if (str.substr(-1) !== ";") str += ";";
    return replace(str);
  }
  // TODO consider creating a merged map
  return function (str) {
    return String(str).replace(re, replacer);
  };
}();
function getReplacer(map) {
  return function replace(str) {
    if (str.charAt(1) === "#") {
      var secondChar = str.charAt(2);
      if (secondChar === "X" || secondChar === "x") {
        return decode_codepoint_1["default"](parseInt(str.substr(3), 16));
      }
      return decode_codepoint_1["default"](parseInt(str.substr(2), 10));
    }
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    return map[str.slice(1, -1)] || str;
  };
}

/***/ }),

/***/ "./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/decode_codepoint.js":
/*!*****************************************************************************************!*\
  !*** ./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/decode_codepoint.js ***!
  \*****************************************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
var decode_json_1 = __importDefault(__webpack_require__(/*! ./maps/decode.json */ "./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/maps/decode.json"));
// Adapted from https://github.com/mathiasbynens/he/blob/master/src/he.js#L94-L119
var fromCodePoint =
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
String.fromCodePoint || function (codePoint) {
  var output = "";
  if (codePoint > 0xffff) {
    codePoint -= 0x10000;
    output += String.fromCharCode(codePoint >>> 10 & 0x3ff | 0xd800);
    codePoint = 0xdc00 | codePoint & 0x3ff;
  }
  output += String.fromCharCode(codePoint);
  return output;
};
function decodeCodePoint(codePoint) {
  if (codePoint >= 0xd800 && codePoint <= 0xdfff || codePoint > 0x10ffff) {
    return "\uFFFD";
  }
  if (codePoint in decode_json_1["default"]) {
    codePoint = decode_json_1["default"][codePoint];
  }
  return fromCodePoint(codePoint);
}
exports["default"] = decodeCodePoint;

/***/ }),

/***/ "./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/encode.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/encode.js ***!
  \*******************************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";


var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.escapeUTF8 = exports.escape = exports.encodeNonAsciiHTML = exports.encodeHTML = exports.encodeXML = void 0;
var xml_json_1 = __importDefault(__webpack_require__(/*! ./maps/xml.json */ "./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/maps/xml.json"));
var inverseXML = getInverseObj(xml_json_1["default"]);
var xmlReplacer = getInverseReplacer(inverseXML);
/**
 * Encodes all non-ASCII characters, as well as characters not valid in XML
 * documents using XML entities.
 *
 * If a character has no equivalent entity, a
 * numeric hexadecimal reference (eg. `&#xfc;`) will be used.
 */
exports.encodeXML = getASCIIEncoder(inverseXML);
var entities_json_1 = __importDefault(__webpack_require__(/*! ./maps/entities.json */ "./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/maps/entities.json"));
var inverseHTML = getInverseObj(entities_json_1["default"]);
var htmlReplacer = getInverseReplacer(inverseHTML);
/**
 * Encodes all entities and non-ASCII characters in the input.
 *
 * This includes characters that are valid ASCII characters in HTML documents.
 * For example `#` will be encoded as `&num;`. To get a more compact output,
 * consider using the `encodeNonAsciiHTML` function.
 *
 * If a character has no equivalent entity, a
 * numeric hexadecimal reference (eg. `&#xfc;`) will be used.
 */
exports.encodeHTML = getInverse(inverseHTML, htmlReplacer);
/**
 * Encodes all non-ASCII characters, as well as characters not valid in HTML
 * documents using HTML entities.
 *
 * If a character has no equivalent entity, a
 * numeric hexadecimal reference (eg. `&#xfc;`) will be used.
 */
exports.encodeNonAsciiHTML = getASCIIEncoder(inverseHTML);
function getInverseObj(obj) {
  return Object.keys(obj).sort().reduce(function (inverse, name) {
    inverse[obj[name]] = "&" + name + ";";
    return inverse;
  }, {});
}
function getInverseReplacer(inverse) {
  var single = [];
  var multiple = [];
  for (var _i = 0, _a = Object.keys(inverse); _i < _a.length; _i++) {
    var k = _a[_i];
    if (k.length === 1) {
      // Add value to single array
      single.push("\\" + k);
    } else {
      // Add value to multiple array
      multiple.push(k);
    }
  }
  // Add ranges to single characters.
  single.sort();
  for (var start = 0; start < single.length - 1; start++) {
    // Find the end of a run of characters
    var end = start;
    while (end < single.length - 1 && single[end].charCodeAt(1) + 1 === single[end + 1].charCodeAt(1)) {
      end += 1;
    }
    var count = 1 + end - start;
    // We want to replace at least three characters
    if (count < 3) continue;
    single.splice(start, count, single[start] + "-" + single[end]);
  }
  multiple.unshift("[" + single.join("") + "]");
  return new RegExp(multiple.join("|"), "g");
}
// /[^\0-\x7F]/gu
var reNonASCII = /(?:[\x80-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g;
var getCodePoint =
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
String.prototype.codePointAt != null ?
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
function (str) {
  return str.codePointAt(0);
} :
// http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
function (c) {
  return (c.charCodeAt(0) - 0xd800) * 0x400 + c.charCodeAt(1) - 0xdc00 + 0x10000;
};
function singleCharReplacer(c) {
  return "&#x" + (c.length > 1 ? getCodePoint(c) : c.charCodeAt(0)).toString(16).toUpperCase() + ";";
}
function getInverse(inverse, re) {
  return function (data) {
    return data.replace(re, function (name) {
      return inverse[name];
    }).replace(reNonASCII, singleCharReplacer);
  };
}
var reEscapeChars = new RegExp(xmlReplacer.source + "|" + reNonASCII.source, "g");
/**
 * Encodes all non-ASCII characters, as well as characters not valid in XML
 * documents using numeric hexadecimal reference (eg. `&#xfc;`).
 *
 * Have a look at `escapeUTF8` if you want a more concise output at the expense
 * of reduced transportability.
 *
 * @param data String to escape.
 */
function escape(data) {
  return data.replace(reEscapeChars, singleCharReplacer);
}
exports.escape = escape;
/**
 * Encodes all characters not valid in XML documents using numeric hexadecimal
 * reference (eg. `&#xfc;`).
 *
 * Note that the output will be character-set dependent.
 *
 * @param data String to escape.
 */
function escapeUTF8(data) {
  return data.replace(xmlReplacer, singleCharReplacer);
}
exports.escapeUTF8 = escapeUTF8;
function getASCIIEncoder(obj) {
  return function (data) {
    return data.replace(reEscapeChars, function (c) {
      return obj[c] || singleCharReplacer(c);
    });
  };
}

/***/ }),

/***/ "./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/index.js":
/*!******************************************************************************!*\
  !*** ./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/index.js ***!
  \******************************************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.decodeXMLStrict = exports.decodeHTML5Strict = exports.decodeHTML4Strict = exports.decodeHTML5 = exports.decodeHTML4 = exports.decodeHTMLStrict = exports.decodeHTML = exports.decodeXML = exports.encodeHTML5 = exports.encodeHTML4 = exports.escapeUTF8 = exports.escape = exports.encodeNonAsciiHTML = exports.encodeHTML = exports.encodeXML = exports.encode = exports.decodeStrict = exports.decode = void 0;
var decode_1 = __webpack_require__(/*! ./decode */ "./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/decode.js");
var encode_1 = __webpack_require__(/*! ./encode */ "./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/encode.js");
/**
 * Decodes a string with entities.
 *
 * @param data String to decode.
 * @param level Optional level to decode at. 0 = XML, 1 = HTML. Default is 0.
 * @deprecated Use `decodeXML` or `decodeHTML` directly.
 */
function decode(data, level) {
  return (!level || level <= 0 ? decode_1.decodeXML : decode_1.decodeHTML)(data);
}
exports.decode = decode;
/**
 * Decodes a string with entities. Does not allow missing trailing semicolons for entities.
 *
 * @param data String to decode.
 * @param level Optional level to decode at. 0 = XML, 1 = HTML. Default is 0.
 * @deprecated Use `decodeHTMLStrict` or `decodeXML` directly.
 */
function decodeStrict(data, level) {
  return (!level || level <= 0 ? decode_1.decodeXML : decode_1.decodeHTMLStrict)(data);
}
exports.decodeStrict = decodeStrict;
/**
 * Encodes a string with entities.
 *
 * @param data String to encode.
 * @param level Optional level to encode at. 0 = XML, 1 = HTML. Default is 0.
 * @deprecated Use `encodeHTML`, `encodeXML` or `encodeNonAsciiHTML` directly.
 */
function encode(data, level) {
  return (!level || level <= 0 ? encode_1.encodeXML : encode_1.encodeHTML)(data);
}
exports.encode = encode;
var encode_2 = __webpack_require__(/*! ./encode */ "./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/encode.js");
Object.defineProperty(exports, "encodeXML", ({
  enumerable: true,
  get: function get() {
    return encode_2.encodeXML;
  }
}));
Object.defineProperty(exports, "encodeHTML", ({
  enumerable: true,
  get: function get() {
    return encode_2.encodeHTML;
  }
}));
Object.defineProperty(exports, "encodeNonAsciiHTML", ({
  enumerable: true,
  get: function get() {
    return encode_2.encodeNonAsciiHTML;
  }
}));
Object.defineProperty(exports, "escape", ({
  enumerable: true,
  get: function get() {
    return encode_2.escape;
  }
}));
Object.defineProperty(exports, "escapeUTF8", ({
  enumerable: true,
  get: function get() {
    return encode_2.escapeUTF8;
  }
}));
// Legacy aliases (deprecated)
Object.defineProperty(exports, "encodeHTML4", ({
  enumerable: true,
  get: function get() {
    return encode_2.encodeHTML;
  }
}));
Object.defineProperty(exports, "encodeHTML5", ({
  enumerable: true,
  get: function get() {
    return encode_2.encodeHTML;
  }
}));
var decode_2 = __webpack_require__(/*! ./decode */ "./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/decode.js");
Object.defineProperty(exports, "decodeXML", ({
  enumerable: true,
  get: function get() {
    return decode_2.decodeXML;
  }
}));
Object.defineProperty(exports, "decodeHTML", ({
  enumerable: true,
  get: function get() {
    return decode_2.decodeHTML;
  }
}));
Object.defineProperty(exports, "decodeHTMLStrict", ({
  enumerable: true,
  get: function get() {
    return decode_2.decodeHTMLStrict;
  }
}));
// Legacy aliases (deprecated)
Object.defineProperty(exports, "decodeHTML4", ({
  enumerable: true,
  get: function get() {
    return decode_2.decodeHTML;
  }
}));
Object.defineProperty(exports, "decodeHTML5", ({
  enumerable: true,
  get: function get() {
    return decode_2.decodeHTML;
  }
}));
Object.defineProperty(exports, "decodeHTML4Strict", ({
  enumerable: true,
  get: function get() {
    return decode_2.decodeHTMLStrict;
  }
}));
Object.defineProperty(exports, "decodeHTML5Strict", ({
  enumerable: true,
  get: function get() {
    return decode_2.decodeHTMLStrict;
  }
}));
Object.defineProperty(exports, "decodeXMLStrict", ({
  enumerable: true,
  get: function get() {
    return decode_2.decodeXML;
  }
}));

/***/ }),

/***/ "./node_modules/.pnpm/isomorphic-xml2js@0.1.3/node_modules/isomorphic-xml2js/dist/lib/browser.js":
/*!*******************************************************************************************************!*\
  !*** ./node_modules/.pnpm/isomorphic-xml2js@0.1.3/node_modules/isomorphic-xml2js/dist/lib/browser.js ***!
  \*******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Builder: () => (/* reexport safe */ _builder__WEBPACK_IMPORTED_MODULE_1__.Builder),
/* harmony export */   Parser: () => (/* reexport safe */ _parser__WEBPACK_IMPORTED_MODULE_0__.Parser),
/* harmony export */   parseString: () => (/* reexport safe */ _parser__WEBPACK_IMPORTED_MODULE_0__.parseString)
/* harmony export */ });
/* harmony import */ var _parser__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./parser */ "./node_modules/.pnpm/isomorphic-xml2js@0.1.3/node_modules/isomorphic-xml2js/dist/lib/parser.js");
/* harmony import */ var _builder__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./builder */ "./node_modules/.pnpm/isomorphic-xml2js@0.1.3/node_modules/isomorphic-xml2js/dist/lib/builder.js");




/***/ }),

/***/ "./node_modules/.pnpm/isomorphic-xml2js@0.1.3/node_modules/isomorphic-xml2js/dist/lib/builder.js":
/*!*******************************************************************************************************!*\
  !*** ./node_modules/.pnpm/isomorphic-xml2js@0.1.3/node_modules/isomorphic-xml2js/dist/lib/builder.js ***!
  \*******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Builder: () => (/* binding */ Builder)
/* harmony export */ });
/* harmony import */ var _options__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./options */ "./node_modules/.pnpm/isomorphic-xml2js@0.1.3/node_modules/isomorphic-xml2js/dist/lib/options.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }

var doc = document.implementation.createDocument(null, null, null);
var serializer = new XMLSerializer();
var Builder = /** @class */function () {
  function Builder(opts) {
    this.opts = (0,_options__WEBPACK_IMPORTED_MODULE_0__.overrideDefaultsWith)(opts);
  }
  Builder.prototype.buildAttributes = function (attrs) {
    var result = [];
    for (var _i = 0, _a = Object.keys(attrs); _i < _a.length; _i++) {
      var key = _a[_i];
      var attr = doc.createAttribute(key);
      attr.value = attrs[key].toString();
      result.push(attr);
    }
    return result;
  };
  Builder.prototype.buildNode = function (obj, context) {
    var attrkey = this.opts.attrkey || _options__WEBPACK_IMPORTED_MODULE_0__.defaultAttrkey;
    var charkey = this.opts.charkey || _options__WEBPACK_IMPORTED_MODULE_0__.defaultCharkey;
    var childkey = this.opts.childkey || _options__WEBPACK_IMPORTED_MODULE_0__.defaultChildkey;
    if (obj == undefined) {
      obj = this.opts.emptyTag || '';
    }
    if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean") {
      var elem = doc.createElement(context.elementName);
      elem.textContent = obj.toString();
      return [elem];
    } else if (Array.isArray(obj)) {
      var result = [];
      for (var _i = 0, obj_1 = obj; _i < obj_1.length; _i++) {
        var arrayElem = obj_1[_i];
        for (var _a = 0, _b = this.buildNode(arrayElem, context); _a < _b.length; _a++) {
          var child = _b[_a];
          result.push(child);
        }
      }
      return result;
    } else if (_typeof(obj) === "object") {
      var elem = doc.createElement(context.elementName);
      for (var _c = 0, _d = Object.keys(obj); _c < _d.length; _c++) {
        var key = _d[_c];
        if (key === attrkey) {
          for (var _e = 0, _f = this.buildAttributes(obj[key]); _e < _f.length; _e++) {
            var attr = _f[_e];
            elem.attributes.setNamedItem(attr);
          }
        } else if (key === childkey && !(this.opts.explicitChildren && this.opts.preserveChildrenOrder)) {
          var children = obj[childkey];
          for (var _g = 0, _h = Object.keys(children); _g < _h.length; _g++) {
            var childElementKey = _h[_g];
            for (var _j = 0, _k = this.buildNode(children[childElementKey], {
                elementName: childElementKey
              }); _j < _k.length; _j++) {
              var child = _k[_j];
              elem.appendChild(child);
            }
          }
        } else if (key === charkey) {
          elem.appendChild(document.createTextNode(obj[key]));
        } else {
          for (var _l = 0, _m = this.buildNode(obj[key], {
              elementName: key
            }); _l < _m.length; _l++) {
            var child = _m[_l];
            elem.appendChild(child);
          }
        }
      }
      return [elem];
    } else {
      throw new Error("Illegal value passed to buildObject: " + obj);
    }
  };
  Builder.prototype.buildObject = function (obj) {
    var rootName = this.opts.rootName || "root";
    if (Array.isArray(obj)) {
      var mergedObj = {};
      for (var _i = 0, obj_2 = obj; _i < obj_2.length; _i++) {
        var arrayElem = obj_2[_i];
        for (var _a = 0, _b = Object.keys(arrayElem); _a < _b.length; _a++) {
          var key = _b[_a];
          if (!mergedObj[key]) {
            mergedObj[key] = [];
          }
          mergedObj[key].push(arrayElem[key]);
        }
      }
      obj = mergedObj;
    }
    var keys = Object.keys(obj);
    var dom;
    if (keys.length <= 1 && !this.opts.rootName && this.opts.explicitRoot) {
      dom = this.buildNode(obj[keys[0]] || '', {
        elementName: keys[0] || rootName
      })[0];
    } else {
      dom = this.buildNode(obj, {
        elementName: rootName
      })[0];
    }
    var xmlString = serializer.serializeToString(dom);
    var xmldec = this.opts.xmldec;
    if (xmldec && !this.opts.headless) {
      var declaration = "<?xml version=\"" + xmldec.version + "\" encoding=\"" + xmldec.encoding + "\" standalone=\"" + (xmldec.standalone ? "yes" : "no") + "\"?>";
      xmlString = declaration + xmlString;
    }
    return xmlString;
  };
  return Builder;
}();


/***/ }),

/***/ "./node_modules/.pnpm/isomorphic-xml2js@0.1.3/node_modules/isomorphic-xml2js/dist/lib/options.js":
/*!*******************************************************************************************************!*\
  !*** ./node_modules/.pnpm/isomorphic-xml2js@0.1.3/node_modules/isomorphic-xml2js/dist/lib/options.js ***!
  \*******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   defaultAttrkey: () => (/* binding */ defaultAttrkey),
/* harmony export */   defaultCharkey: () => (/* binding */ defaultCharkey),
/* harmony export */   defaultChildkey: () => (/* binding */ defaultChildkey),
/* harmony export */   overrideDefaultsWith: () => (/* binding */ overrideDefaultsWith)
/* harmony export */ });
var __assign = undefined && undefined.__assign || Object.assign || function (t) {
  for (var s, i = 1, n = arguments.length; i < n; i++) {
    s = arguments[i];
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
  }
  return t;
};
var defaultOptions = {
  explicitRoot: true,
  explicitArray: true,
  emptyTag: '',
  strict: true,
  tagNameProcessors: [],
  valueProcessors: [],
  attrNameProcessors: [],
  attrValueProcessors: [],
  xmldec: {
    version: "1.0",
    encoding: "UTF-8",
    standalone: true
  }
};
var defaultCharkey = "_";
var defaultAttrkey = "$";
var defaultChildkey = "$$";
function overrideDefaultsWith(userOptions) {
  // Ideally we would just use some generic deep merge thing here but don't want to pull in dependencies
  return __assign({}, defaultOptions, userOptions, {
    xmldec: __assign({}, defaultOptions.xmldec, userOptions && userOptions.xmldec)
  });
}

/***/ }),

/***/ "./node_modules/.pnpm/isomorphic-xml2js@0.1.3/node_modules/isomorphic-xml2js/dist/lib/parser.js":
/*!******************************************************************************************************!*\
  !*** ./node_modules/.pnpm/isomorphic-xml2js@0.1.3/node_modules/isomorphic-xml2js/dist/lib/parser.js ***!
  \******************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Parser: () => (/* binding */ Parser),
/* harmony export */   parseString: () => (/* binding */ parseString)
/* harmony export */ });
/* harmony import */ var _options__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./options */ "./node_modules/.pnpm/isomorphic-xml2js@0.1.3/node_modules/isomorphic-xml2js/dist/lib/options.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var __assign = undefined && undefined.__assign || Object.assign || function (t) {
  for (var s, i = 1, n = arguments.length; i < n; i++) {
    s = arguments[i];
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
  }
  return t;
};

var errorNS;
try {
  errorNS = new DOMParser().parseFromString('INVALID', 'text/xml').getElementsByTagName("parsererror")[0].namespaceURI;
} catch (ignored) {
  // Most browsers will return a document containing <parsererror>, but IE will throw.
}
function throwIfError(dom) {
  if (errorNS) {
    var parserErrors = dom.getElementsByTagNameNS(errorNS, "parsererror");
    if (parserErrors.length) {
      throw new Error(parserErrors.item(0).innerHTML);
    }
  }
}
function parseString(xml, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = undefined;
  }
  new Parser(options).parseString(xml, callback);
}
function isElement(node) {
  return !!node.attributes;
}
var Parser = /** @class */function () {
  function Parser(opts) {
    this.opts = (0,_options__WEBPACK_IMPORTED_MODULE_0__.overrideDefaultsWith)(opts);
  }
  Parser.prototype.tagName = function (nodeName) {
    return this.opts.tagNameProcessors.reduce(function (str, fn) {
      return fn(str);
    }, this.opts.normalizeTags ? nodeName.toLowerCase() : nodeName);
  };
  Parser.prototype.parseString = function (xml, callback) {
    var parser = new DOMParser();
    var obj;
    try {
      var dom = parser.parseFromString(xml, "application/xml");
      throwIfError(dom);
      if (this.opts.explicitRoot) {
        var childName = this.tagName(dom.documentElement.nodeName);
        obj = (_a = {}, _a[childName] = this.domToObject(dom.childNodes[0]), _a);
      } else {
        obj = this.domToObject(dom.childNodes[0]);
      }
    } catch (err) {
      callback(err);
      return;
    }
    callback(null, obj);
    var _a;
  };
  ;
  Parser.prototype.parseAttributes = function (node) {
    if (this.opts.ignoreAttrs || !isElement(node) || !node.hasAttributes()) {
      return undefined;
    }
    var namespaceKey = (this.opts.attrkey || _options__WEBPACK_IMPORTED_MODULE_0__.defaultAttrkey) + "ns";
    var attrsObject = {};
    if (isElement(node) && node.hasAttributes()) {
      for (var i = 0; i < node.attributes.length; i++) {
        var attr = node.attributes[i];
        var attrName = this.opts.attrNameProcessors.reduce(function (str, fn) {
          return fn(str);
        }, attr.nodeName);
        var attrValue = this.opts.attrValueProcessors.reduce(function (str, fn) {
          return fn(str);
        }, attr.nodeValue);
        if (this.opts.xmlns) {
          attrsObject[attrName] = {
            value: attrValue,
            local: attr.localName,
            uri: attr.namespaceURI
          };
        } else {
          attrsObject[attrName] = attrValue;
        }
      }
    }
    return attrsObject;
  };
  Parser.prototype.domToObject = function (node) {
    if (node.childNodes.length === 0 && !(isElement(node) && node.hasAttributes())) {
      return this.opts.emptyTag;
    }
    var attrsObject = this.parseAttributes(node);
    var childkey = this.opts.childkey || _options__WEBPACK_IMPORTED_MODULE_0__.defaultChildkey;
    var charkey = this.opts.charkey || _options__WEBPACK_IMPORTED_MODULE_0__.defaultCharkey;
    var result = {};
    var allTextContent = '';
    for (var i = 0; i < node.childNodes.length; i++) {
      var child = node.childNodes[i];
      if (child.nodeType === Node.TEXT_NODE || child.nodeType === Node.CDATA_SECTION_NODE) {
        var nodeValue = child.nodeValue || '';
        var textContent = this.opts.normalize ? nodeValue.replace(/\n[ ]+\b/g, ' ').trim() : this.opts.trim ? nodeValue.trim() : nodeValue;
        allTextContent += textContent;
        var addTextChild = this.opts.explicitChildren && this.opts.preserveChildrenOrder && this.opts.charsAsChildren && (this.opts.includeWhiteChars || textContent.trim());
        if (addTextChild) {
          if (!result[childkey]) {
            result[childkey] = [];
          }
          result[childkey].push((_a = {
            "#name": "__text__"
          }, _a[charkey] = textContent, _a));
        }
      } else {
        var childObject = this.domToObject(child);
        var childName = this.tagName(child.nodeName);
        if (!result[childName]) {
          result[childName] = this.opts.explicitArray ? [this.domToObject(child)] : this.domToObject(child);
        } else if (Array.isArray(result[childName])) {
          result[childName].push(childObject);
        } else {
          result[childName] = [result[childName], this.domToObject(child)];
        }
        if (this.opts.explicitChildren && this.opts.preserveChildrenOrder) {
          if (!result[childkey]) {
            result[childkey] = [];
          }
          if (_typeof(childObject) === "object") {
            result[childkey].push(__assign({
              "#name": childName
            }, childObject));
          } else {
            result[childkey].push((_b = {
              "#name": childName
            }, _b[charkey] = childObject, _b));
          }
        }
      }
    }
    if (Object.keys(result).length === 0 && !attrsObject && !this.opts.explicitCharkey && !this.opts.charkey && !this.opts.xmlns) {
      // Consider passing down the processed tag name instead of recomputing it
      var childName_1 = this.tagName(node.nodeName);
      return this.opts.valueProcessors.reduce(function (str, fn) {
        return fn(str, childName_1);
      }, allTextContent);
    }
    // TODO: can this logic be simplified?
    var useExplicitChildrenObj = (this.opts.explicitChildren || this.opts.childkey) && !this.opts.preserveChildrenOrder && (Object.keys(result).length > 0 || allTextContent && this.opts.charsAsChildren);
    if (useExplicitChildrenObj) {
      result = (_c = {}, _c[childkey] = result, _c);
    }
    if (allTextContent && this.opts.includeWhiteChars || allTextContent.trim()) {
      if (useExplicitChildrenObj && this.opts.charsAsChildren) {
        result[childkey][charkey] = allTextContent;
      } else {
        result[charkey] = allTextContent;
      }
    }
    if (this.opts.xmlns) {
      var namespaceKey = (this.opts.attrkey || _options__WEBPACK_IMPORTED_MODULE_0__.defaultAttrkey) + "ns";
      result[namespaceKey] = {
        local: node.localName,
        uri: node.namespaceURI
      };
    }
    if (attrsObject) {
      if (this.opts.mergeAttrs) {
        if (this.opts.explicitArray) {
          for (var _i = 0, _d = Object.keys(attrsObject); _i < _d.length; _i++) {
            var key = _d[_i];
            result[key] = [attrsObject[key]];
          }
        } else {
          result = __assign({}, result, attrsObject);
        }
      } else {
        result[this.opts.attrkey || _options__WEBPACK_IMPORTED_MODULE_0__.defaultAttrkey] = attrsObject;
      }
    }
    return result;
    var _a, _b, _c;
  };
  return Parser;
}();


/***/ }),

/***/ "?4dd1":
/*!**********************!*\
  !*** http (ignored) ***!
  \**********************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "?2a16":
/*!***********************!*\
  !*** https (ignored) ***!
  \***********************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "?32c8":
/*!*********************!*\
  !*** url (ignored) ***!
  \*********************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/maps/decode.json":
/*!**************************************************************************************!*\
  !*** ./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/maps/decode.json ***!
  \**************************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('{"0":65533,"128":8364,"130":8218,"131":402,"132":8222,"133":8230,"134":8224,"135":8225,"136":710,"137":8240,"138":352,"139":8249,"140":338,"142":381,"145":8216,"146":8217,"147":8220,"148":8221,"149":8226,"150":8211,"151":8212,"152":732,"153":8482,"154":353,"155":8250,"156":339,"158":382,"159":376}');

/***/ }),

/***/ "./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/maps/entities.json":
/*!****************************************************************************************!*\
  !*** ./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/maps/entities.json ***!
  \****************************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('{"Aacute":"Á","aacute":"á","Abreve":"Ă","abreve":"ă","ac":"∾","acd":"∿","acE":"∾̳","Acirc":"Â","acirc":"â","acute":"´","Acy":"А","acy":"а","AElig":"Æ","aelig":"æ","af":"⁡","Afr":"𝔄","afr":"𝔞","Agrave":"À","agrave":"à","alefsym":"ℵ","aleph":"ℵ","Alpha":"Α","alpha":"α","Amacr":"Ā","amacr":"ā","amalg":"⨿","amp":"&","AMP":"&","andand":"⩕","And":"⩓","and":"∧","andd":"⩜","andslope":"⩘","andv":"⩚","ang":"∠","ange":"⦤","angle":"∠","angmsdaa":"⦨","angmsdab":"⦩","angmsdac":"⦪","angmsdad":"⦫","angmsdae":"⦬","angmsdaf":"⦭","angmsdag":"⦮","angmsdah":"⦯","angmsd":"∡","angrt":"∟","angrtvb":"⊾","angrtvbd":"⦝","angsph":"∢","angst":"Å","angzarr":"⍼","Aogon":"Ą","aogon":"ą","Aopf":"𝔸","aopf":"𝕒","apacir":"⩯","ap":"≈","apE":"⩰","ape":"≊","apid":"≋","apos":"\'","ApplyFunction":"⁡","approx":"≈","approxeq":"≊","Aring":"Å","aring":"å","Ascr":"𝒜","ascr":"𝒶","Assign":"≔","ast":"*","asymp":"≈","asympeq":"≍","Atilde":"Ã","atilde":"ã","Auml":"Ä","auml":"ä","awconint":"∳","awint":"⨑","backcong":"≌","backepsilon":"϶","backprime":"‵","backsim":"∽","backsimeq":"⋍","Backslash":"∖","Barv":"⫧","barvee":"⊽","barwed":"⌅","Barwed":"⌆","barwedge":"⌅","bbrk":"⎵","bbrktbrk":"⎶","bcong":"≌","Bcy":"Б","bcy":"б","bdquo":"„","becaus":"∵","because":"∵","Because":"∵","bemptyv":"⦰","bepsi":"϶","bernou":"ℬ","Bernoullis":"ℬ","Beta":"Β","beta":"β","beth":"ℶ","between":"≬","Bfr":"𝔅","bfr":"𝔟","bigcap":"⋂","bigcirc":"◯","bigcup":"⋃","bigodot":"⨀","bigoplus":"⨁","bigotimes":"⨂","bigsqcup":"⨆","bigstar":"★","bigtriangledown":"▽","bigtriangleup":"△","biguplus":"⨄","bigvee":"⋁","bigwedge":"⋀","bkarow":"⤍","blacklozenge":"⧫","blacksquare":"▪","blacktriangle":"▴","blacktriangledown":"▾","blacktriangleleft":"◂","blacktriangleright":"▸","blank":"␣","blk12":"▒","blk14":"░","blk34":"▓","block":"█","bne":"=⃥","bnequiv":"≡⃥","bNot":"⫭","bnot":"⌐","Bopf":"𝔹","bopf":"𝕓","bot":"⊥","bottom":"⊥","bowtie":"⋈","boxbox":"⧉","boxdl":"┐","boxdL":"╕","boxDl":"╖","boxDL":"╗","boxdr":"┌","boxdR":"╒","boxDr":"╓","boxDR":"╔","boxh":"─","boxH":"═","boxhd":"┬","boxHd":"╤","boxhD":"╥","boxHD":"╦","boxhu":"┴","boxHu":"╧","boxhU":"╨","boxHU":"╩","boxminus":"⊟","boxplus":"⊞","boxtimes":"⊠","boxul":"┘","boxuL":"╛","boxUl":"╜","boxUL":"╝","boxur":"└","boxuR":"╘","boxUr":"╙","boxUR":"╚","boxv":"│","boxV":"║","boxvh":"┼","boxvH":"╪","boxVh":"╫","boxVH":"╬","boxvl":"┤","boxvL":"╡","boxVl":"╢","boxVL":"╣","boxvr":"├","boxvR":"╞","boxVr":"╟","boxVR":"╠","bprime":"‵","breve":"˘","Breve":"˘","brvbar":"¦","bscr":"𝒷","Bscr":"ℬ","bsemi":"⁏","bsim":"∽","bsime":"⋍","bsolb":"⧅","bsol":"\\\\","bsolhsub":"⟈","bull":"•","bullet":"•","bump":"≎","bumpE":"⪮","bumpe":"≏","Bumpeq":"≎","bumpeq":"≏","Cacute":"Ć","cacute":"ć","capand":"⩄","capbrcup":"⩉","capcap":"⩋","cap":"∩","Cap":"⋒","capcup":"⩇","capdot":"⩀","CapitalDifferentialD":"ⅅ","caps":"∩︀","caret":"⁁","caron":"ˇ","Cayleys":"ℭ","ccaps":"⩍","Ccaron":"Č","ccaron":"č","Ccedil":"Ç","ccedil":"ç","Ccirc":"Ĉ","ccirc":"ĉ","Cconint":"∰","ccups":"⩌","ccupssm":"⩐","Cdot":"Ċ","cdot":"ċ","cedil":"¸","Cedilla":"¸","cemptyv":"⦲","cent":"¢","centerdot":"·","CenterDot":"·","cfr":"𝔠","Cfr":"ℭ","CHcy":"Ч","chcy":"ч","check":"✓","checkmark":"✓","Chi":"Χ","chi":"χ","circ":"ˆ","circeq":"≗","circlearrowleft":"↺","circlearrowright":"↻","circledast":"⊛","circledcirc":"⊚","circleddash":"⊝","CircleDot":"⊙","circledR":"®","circledS":"Ⓢ","CircleMinus":"⊖","CirclePlus":"⊕","CircleTimes":"⊗","cir":"○","cirE":"⧃","cire":"≗","cirfnint":"⨐","cirmid":"⫯","cirscir":"⧂","ClockwiseContourIntegral":"∲","CloseCurlyDoubleQuote":"”","CloseCurlyQuote":"’","clubs":"♣","clubsuit":"♣","colon":":","Colon":"∷","Colone":"⩴","colone":"≔","coloneq":"≔","comma":",","commat":"@","comp":"∁","compfn":"∘","complement":"∁","complexes":"ℂ","cong":"≅","congdot":"⩭","Congruent":"≡","conint":"∮","Conint":"∯","ContourIntegral":"∮","copf":"𝕔","Copf":"ℂ","coprod":"∐","Coproduct":"∐","copy":"©","COPY":"©","copysr":"℗","CounterClockwiseContourIntegral":"∳","crarr":"↵","cross":"✗","Cross":"⨯","Cscr":"𝒞","cscr":"𝒸","csub":"⫏","csube":"⫑","csup":"⫐","csupe":"⫒","ctdot":"⋯","cudarrl":"⤸","cudarrr":"⤵","cuepr":"⋞","cuesc":"⋟","cularr":"↶","cularrp":"⤽","cupbrcap":"⩈","cupcap":"⩆","CupCap":"≍","cup":"∪","Cup":"⋓","cupcup":"⩊","cupdot":"⊍","cupor":"⩅","cups":"∪︀","curarr":"↷","curarrm":"⤼","curlyeqprec":"⋞","curlyeqsucc":"⋟","curlyvee":"⋎","curlywedge":"⋏","curren":"¤","curvearrowleft":"↶","curvearrowright":"↷","cuvee":"⋎","cuwed":"⋏","cwconint":"∲","cwint":"∱","cylcty":"⌭","dagger":"†","Dagger":"‡","daleth":"ℸ","darr":"↓","Darr":"↡","dArr":"⇓","dash":"‐","Dashv":"⫤","dashv":"⊣","dbkarow":"⤏","dblac":"˝","Dcaron":"Ď","dcaron":"ď","Dcy":"Д","dcy":"д","ddagger":"‡","ddarr":"⇊","DD":"ⅅ","dd":"ⅆ","DDotrahd":"⤑","ddotseq":"⩷","deg":"°","Del":"∇","Delta":"Δ","delta":"δ","demptyv":"⦱","dfisht":"⥿","Dfr":"𝔇","dfr":"𝔡","dHar":"⥥","dharl":"⇃","dharr":"⇂","DiacriticalAcute":"´","DiacriticalDot":"˙","DiacriticalDoubleAcute":"˝","DiacriticalGrave":"`","DiacriticalTilde":"˜","diam":"⋄","diamond":"⋄","Diamond":"⋄","diamondsuit":"♦","diams":"♦","die":"¨","DifferentialD":"ⅆ","digamma":"ϝ","disin":"⋲","div":"÷","divide":"÷","divideontimes":"⋇","divonx":"⋇","DJcy":"Ђ","djcy":"ђ","dlcorn":"⌞","dlcrop":"⌍","dollar":"$","Dopf":"𝔻","dopf":"𝕕","Dot":"¨","dot":"˙","DotDot":"⃜","doteq":"≐","doteqdot":"≑","DotEqual":"≐","dotminus":"∸","dotplus":"∔","dotsquare":"⊡","doublebarwedge":"⌆","DoubleContourIntegral":"∯","DoubleDot":"¨","DoubleDownArrow":"⇓","DoubleLeftArrow":"⇐","DoubleLeftRightArrow":"⇔","DoubleLeftTee":"⫤","DoubleLongLeftArrow":"⟸","DoubleLongLeftRightArrow":"⟺","DoubleLongRightArrow":"⟹","DoubleRightArrow":"⇒","DoubleRightTee":"⊨","DoubleUpArrow":"⇑","DoubleUpDownArrow":"⇕","DoubleVerticalBar":"∥","DownArrowBar":"⤓","downarrow":"↓","DownArrow":"↓","Downarrow":"⇓","DownArrowUpArrow":"⇵","DownBreve":"̑","downdownarrows":"⇊","downharpoonleft":"⇃","downharpoonright":"⇂","DownLeftRightVector":"⥐","DownLeftTeeVector":"⥞","DownLeftVectorBar":"⥖","DownLeftVector":"↽","DownRightTeeVector":"⥟","DownRightVectorBar":"⥗","DownRightVector":"⇁","DownTeeArrow":"↧","DownTee":"⊤","drbkarow":"⤐","drcorn":"⌟","drcrop":"⌌","Dscr":"𝒟","dscr":"𝒹","DScy":"Ѕ","dscy":"ѕ","dsol":"⧶","Dstrok":"Đ","dstrok":"đ","dtdot":"⋱","dtri":"▿","dtrif":"▾","duarr":"⇵","duhar":"⥯","dwangle":"⦦","DZcy":"Џ","dzcy":"џ","dzigrarr":"⟿","Eacute":"É","eacute":"é","easter":"⩮","Ecaron":"Ě","ecaron":"ě","Ecirc":"Ê","ecirc":"ê","ecir":"≖","ecolon":"≕","Ecy":"Э","ecy":"э","eDDot":"⩷","Edot":"Ė","edot":"ė","eDot":"≑","ee":"ⅇ","efDot":"≒","Efr":"𝔈","efr":"𝔢","eg":"⪚","Egrave":"È","egrave":"è","egs":"⪖","egsdot":"⪘","el":"⪙","Element":"∈","elinters":"⏧","ell":"ℓ","els":"⪕","elsdot":"⪗","Emacr":"Ē","emacr":"ē","empty":"∅","emptyset":"∅","EmptySmallSquare":"◻","emptyv":"∅","EmptyVerySmallSquare":"▫","emsp13":" ","emsp14":" ","emsp":" ","ENG":"Ŋ","eng":"ŋ","ensp":" ","Eogon":"Ę","eogon":"ę","Eopf":"𝔼","eopf":"𝕖","epar":"⋕","eparsl":"⧣","eplus":"⩱","epsi":"ε","Epsilon":"Ε","epsilon":"ε","epsiv":"ϵ","eqcirc":"≖","eqcolon":"≕","eqsim":"≂","eqslantgtr":"⪖","eqslantless":"⪕","Equal":"⩵","equals":"=","EqualTilde":"≂","equest":"≟","Equilibrium":"⇌","equiv":"≡","equivDD":"⩸","eqvparsl":"⧥","erarr":"⥱","erDot":"≓","escr":"ℯ","Escr":"ℰ","esdot":"≐","Esim":"⩳","esim":"≂","Eta":"Η","eta":"η","ETH":"Ð","eth":"ð","Euml":"Ë","euml":"ë","euro":"€","excl":"!","exist":"∃","Exists":"∃","expectation":"ℰ","exponentiale":"ⅇ","ExponentialE":"ⅇ","fallingdotseq":"≒","Fcy":"Ф","fcy":"ф","female":"♀","ffilig":"ﬃ","fflig":"ﬀ","ffllig":"ﬄ","Ffr":"𝔉","ffr":"𝔣","filig":"ﬁ","FilledSmallSquare":"◼","FilledVerySmallSquare":"▪","fjlig":"fj","flat":"♭","fllig":"ﬂ","fltns":"▱","fnof":"ƒ","Fopf":"𝔽","fopf":"𝕗","forall":"∀","ForAll":"∀","fork":"⋔","forkv":"⫙","Fouriertrf":"ℱ","fpartint":"⨍","frac12":"½","frac13":"⅓","frac14":"¼","frac15":"⅕","frac16":"⅙","frac18":"⅛","frac23":"⅔","frac25":"⅖","frac34":"¾","frac35":"⅗","frac38":"⅜","frac45":"⅘","frac56":"⅚","frac58":"⅝","frac78":"⅞","frasl":"⁄","frown":"⌢","fscr":"𝒻","Fscr":"ℱ","gacute":"ǵ","Gamma":"Γ","gamma":"γ","Gammad":"Ϝ","gammad":"ϝ","gap":"⪆","Gbreve":"Ğ","gbreve":"ğ","Gcedil":"Ģ","Gcirc":"Ĝ","gcirc":"ĝ","Gcy":"Г","gcy":"г","Gdot":"Ġ","gdot":"ġ","ge":"≥","gE":"≧","gEl":"⪌","gel":"⋛","geq":"≥","geqq":"≧","geqslant":"⩾","gescc":"⪩","ges":"⩾","gesdot":"⪀","gesdoto":"⪂","gesdotol":"⪄","gesl":"⋛︀","gesles":"⪔","Gfr":"𝔊","gfr":"𝔤","gg":"≫","Gg":"⋙","ggg":"⋙","gimel":"ℷ","GJcy":"Ѓ","gjcy":"ѓ","gla":"⪥","gl":"≷","glE":"⪒","glj":"⪤","gnap":"⪊","gnapprox":"⪊","gne":"⪈","gnE":"≩","gneq":"⪈","gneqq":"≩","gnsim":"⋧","Gopf":"𝔾","gopf":"𝕘","grave":"`","GreaterEqual":"≥","GreaterEqualLess":"⋛","GreaterFullEqual":"≧","GreaterGreater":"⪢","GreaterLess":"≷","GreaterSlantEqual":"⩾","GreaterTilde":"≳","Gscr":"𝒢","gscr":"ℊ","gsim":"≳","gsime":"⪎","gsiml":"⪐","gtcc":"⪧","gtcir":"⩺","gt":">","GT":">","Gt":"≫","gtdot":"⋗","gtlPar":"⦕","gtquest":"⩼","gtrapprox":"⪆","gtrarr":"⥸","gtrdot":"⋗","gtreqless":"⋛","gtreqqless":"⪌","gtrless":"≷","gtrsim":"≳","gvertneqq":"≩︀","gvnE":"≩︀","Hacek":"ˇ","hairsp":" ","half":"½","hamilt":"ℋ","HARDcy":"Ъ","hardcy":"ъ","harrcir":"⥈","harr":"↔","hArr":"⇔","harrw":"↭","Hat":"^","hbar":"ℏ","Hcirc":"Ĥ","hcirc":"ĥ","hearts":"♥","heartsuit":"♥","hellip":"…","hercon":"⊹","hfr":"𝔥","Hfr":"ℌ","HilbertSpace":"ℋ","hksearow":"⤥","hkswarow":"⤦","hoarr":"⇿","homtht":"∻","hookleftarrow":"↩","hookrightarrow":"↪","hopf":"𝕙","Hopf":"ℍ","horbar":"―","HorizontalLine":"─","hscr":"𝒽","Hscr":"ℋ","hslash":"ℏ","Hstrok":"Ħ","hstrok":"ħ","HumpDownHump":"≎","HumpEqual":"≏","hybull":"⁃","hyphen":"‐","Iacute":"Í","iacute":"í","ic":"⁣","Icirc":"Î","icirc":"î","Icy":"И","icy":"и","Idot":"İ","IEcy":"Е","iecy":"е","iexcl":"¡","iff":"⇔","ifr":"𝔦","Ifr":"ℑ","Igrave":"Ì","igrave":"ì","ii":"ⅈ","iiiint":"⨌","iiint":"∭","iinfin":"⧜","iiota":"℩","IJlig":"Ĳ","ijlig":"ĳ","Imacr":"Ī","imacr":"ī","image":"ℑ","ImaginaryI":"ⅈ","imagline":"ℐ","imagpart":"ℑ","imath":"ı","Im":"ℑ","imof":"⊷","imped":"Ƶ","Implies":"⇒","incare":"℅","in":"∈","infin":"∞","infintie":"⧝","inodot":"ı","intcal":"⊺","int":"∫","Int":"∬","integers":"ℤ","Integral":"∫","intercal":"⊺","Intersection":"⋂","intlarhk":"⨗","intprod":"⨼","InvisibleComma":"⁣","InvisibleTimes":"⁢","IOcy":"Ё","iocy":"ё","Iogon":"Į","iogon":"į","Iopf":"𝕀","iopf":"𝕚","Iota":"Ι","iota":"ι","iprod":"⨼","iquest":"¿","iscr":"𝒾","Iscr":"ℐ","isin":"∈","isindot":"⋵","isinE":"⋹","isins":"⋴","isinsv":"⋳","isinv":"∈","it":"⁢","Itilde":"Ĩ","itilde":"ĩ","Iukcy":"І","iukcy":"і","Iuml":"Ï","iuml":"ï","Jcirc":"Ĵ","jcirc":"ĵ","Jcy":"Й","jcy":"й","Jfr":"𝔍","jfr":"𝔧","jmath":"ȷ","Jopf":"𝕁","jopf":"𝕛","Jscr":"𝒥","jscr":"𝒿","Jsercy":"Ј","jsercy":"ј","Jukcy":"Є","jukcy":"є","Kappa":"Κ","kappa":"κ","kappav":"ϰ","Kcedil":"Ķ","kcedil":"ķ","Kcy":"К","kcy":"к","Kfr":"𝔎","kfr":"𝔨","kgreen":"ĸ","KHcy":"Х","khcy":"х","KJcy":"Ќ","kjcy":"ќ","Kopf":"𝕂","kopf":"𝕜","Kscr":"𝒦","kscr":"𝓀","lAarr":"⇚","Lacute":"Ĺ","lacute":"ĺ","laemptyv":"⦴","lagran":"ℒ","Lambda":"Λ","lambda":"λ","lang":"⟨","Lang":"⟪","langd":"⦑","langle":"⟨","lap":"⪅","Laplacetrf":"ℒ","laquo":"«","larrb":"⇤","larrbfs":"⤟","larr":"←","Larr":"↞","lArr":"⇐","larrfs":"⤝","larrhk":"↩","larrlp":"↫","larrpl":"⤹","larrsim":"⥳","larrtl":"↢","latail":"⤙","lAtail":"⤛","lat":"⪫","late":"⪭","lates":"⪭︀","lbarr":"⤌","lBarr":"⤎","lbbrk":"❲","lbrace":"{","lbrack":"[","lbrke":"⦋","lbrksld":"⦏","lbrkslu":"⦍","Lcaron":"Ľ","lcaron":"ľ","Lcedil":"Ļ","lcedil":"ļ","lceil":"⌈","lcub":"{","Lcy":"Л","lcy":"л","ldca":"⤶","ldquo":"“","ldquor":"„","ldrdhar":"⥧","ldrushar":"⥋","ldsh":"↲","le":"≤","lE":"≦","LeftAngleBracket":"⟨","LeftArrowBar":"⇤","leftarrow":"←","LeftArrow":"←","Leftarrow":"⇐","LeftArrowRightArrow":"⇆","leftarrowtail":"↢","LeftCeiling":"⌈","LeftDoubleBracket":"⟦","LeftDownTeeVector":"⥡","LeftDownVectorBar":"⥙","LeftDownVector":"⇃","LeftFloor":"⌊","leftharpoondown":"↽","leftharpoonup":"↼","leftleftarrows":"⇇","leftrightarrow":"↔","LeftRightArrow":"↔","Leftrightarrow":"⇔","leftrightarrows":"⇆","leftrightharpoons":"⇋","leftrightsquigarrow":"↭","LeftRightVector":"⥎","LeftTeeArrow":"↤","LeftTee":"⊣","LeftTeeVector":"⥚","leftthreetimes":"⋋","LeftTriangleBar":"⧏","LeftTriangle":"⊲","LeftTriangleEqual":"⊴","LeftUpDownVector":"⥑","LeftUpTeeVector":"⥠","LeftUpVectorBar":"⥘","LeftUpVector":"↿","LeftVectorBar":"⥒","LeftVector":"↼","lEg":"⪋","leg":"⋚","leq":"≤","leqq":"≦","leqslant":"⩽","lescc":"⪨","les":"⩽","lesdot":"⩿","lesdoto":"⪁","lesdotor":"⪃","lesg":"⋚︀","lesges":"⪓","lessapprox":"⪅","lessdot":"⋖","lesseqgtr":"⋚","lesseqqgtr":"⪋","LessEqualGreater":"⋚","LessFullEqual":"≦","LessGreater":"≶","lessgtr":"≶","LessLess":"⪡","lesssim":"≲","LessSlantEqual":"⩽","LessTilde":"≲","lfisht":"⥼","lfloor":"⌊","Lfr":"𝔏","lfr":"𝔩","lg":"≶","lgE":"⪑","lHar":"⥢","lhard":"↽","lharu":"↼","lharul":"⥪","lhblk":"▄","LJcy":"Љ","ljcy":"љ","llarr":"⇇","ll":"≪","Ll":"⋘","llcorner":"⌞","Lleftarrow":"⇚","llhard":"⥫","lltri":"◺","Lmidot":"Ŀ","lmidot":"ŀ","lmoustache":"⎰","lmoust":"⎰","lnap":"⪉","lnapprox":"⪉","lne":"⪇","lnE":"≨","lneq":"⪇","lneqq":"≨","lnsim":"⋦","loang":"⟬","loarr":"⇽","lobrk":"⟦","longleftarrow":"⟵","LongLeftArrow":"⟵","Longleftarrow":"⟸","longleftrightarrow":"⟷","LongLeftRightArrow":"⟷","Longleftrightarrow":"⟺","longmapsto":"⟼","longrightarrow":"⟶","LongRightArrow":"⟶","Longrightarrow":"⟹","looparrowleft":"↫","looparrowright":"↬","lopar":"⦅","Lopf":"𝕃","lopf":"𝕝","loplus":"⨭","lotimes":"⨴","lowast":"∗","lowbar":"_","LowerLeftArrow":"↙","LowerRightArrow":"↘","loz":"◊","lozenge":"◊","lozf":"⧫","lpar":"(","lparlt":"⦓","lrarr":"⇆","lrcorner":"⌟","lrhar":"⇋","lrhard":"⥭","lrm":"‎","lrtri":"⊿","lsaquo":"‹","lscr":"𝓁","Lscr":"ℒ","lsh":"↰","Lsh":"↰","lsim":"≲","lsime":"⪍","lsimg":"⪏","lsqb":"[","lsquo":"‘","lsquor":"‚","Lstrok":"Ł","lstrok":"ł","ltcc":"⪦","ltcir":"⩹","lt":"<","LT":"<","Lt":"≪","ltdot":"⋖","lthree":"⋋","ltimes":"⋉","ltlarr":"⥶","ltquest":"⩻","ltri":"◃","ltrie":"⊴","ltrif":"◂","ltrPar":"⦖","lurdshar":"⥊","luruhar":"⥦","lvertneqq":"≨︀","lvnE":"≨︀","macr":"¯","male":"♂","malt":"✠","maltese":"✠","Map":"⤅","map":"↦","mapsto":"↦","mapstodown":"↧","mapstoleft":"↤","mapstoup":"↥","marker":"▮","mcomma":"⨩","Mcy":"М","mcy":"м","mdash":"—","mDDot":"∺","measuredangle":"∡","MediumSpace":" ","Mellintrf":"ℳ","Mfr":"𝔐","mfr":"𝔪","mho":"℧","micro":"µ","midast":"*","midcir":"⫰","mid":"∣","middot":"·","minusb":"⊟","minus":"−","minusd":"∸","minusdu":"⨪","MinusPlus":"∓","mlcp":"⫛","mldr":"…","mnplus":"∓","models":"⊧","Mopf":"𝕄","mopf":"𝕞","mp":"∓","mscr":"𝓂","Mscr":"ℳ","mstpos":"∾","Mu":"Μ","mu":"μ","multimap":"⊸","mumap":"⊸","nabla":"∇","Nacute":"Ń","nacute":"ń","nang":"∠⃒","nap":"≉","napE":"⩰̸","napid":"≋̸","napos":"ŉ","napprox":"≉","natural":"♮","naturals":"ℕ","natur":"♮","nbsp":" ","nbump":"≎̸","nbumpe":"≏̸","ncap":"⩃","Ncaron":"Ň","ncaron":"ň","Ncedil":"Ņ","ncedil":"ņ","ncong":"≇","ncongdot":"⩭̸","ncup":"⩂","Ncy":"Н","ncy":"н","ndash":"–","nearhk":"⤤","nearr":"↗","neArr":"⇗","nearrow":"↗","ne":"≠","nedot":"≐̸","NegativeMediumSpace":"​","NegativeThickSpace":"​","NegativeThinSpace":"​","NegativeVeryThinSpace":"​","nequiv":"≢","nesear":"⤨","nesim":"≂̸","NestedGreaterGreater":"≫","NestedLessLess":"≪","NewLine":"\\n","nexist":"∄","nexists":"∄","Nfr":"𝔑","nfr":"𝔫","ngE":"≧̸","nge":"≱","ngeq":"≱","ngeqq":"≧̸","ngeqslant":"⩾̸","nges":"⩾̸","nGg":"⋙̸","ngsim":"≵","nGt":"≫⃒","ngt":"≯","ngtr":"≯","nGtv":"≫̸","nharr":"↮","nhArr":"⇎","nhpar":"⫲","ni":"∋","nis":"⋼","nisd":"⋺","niv":"∋","NJcy":"Њ","njcy":"њ","nlarr":"↚","nlArr":"⇍","nldr":"‥","nlE":"≦̸","nle":"≰","nleftarrow":"↚","nLeftarrow":"⇍","nleftrightarrow":"↮","nLeftrightarrow":"⇎","nleq":"≰","nleqq":"≦̸","nleqslant":"⩽̸","nles":"⩽̸","nless":"≮","nLl":"⋘̸","nlsim":"≴","nLt":"≪⃒","nlt":"≮","nltri":"⋪","nltrie":"⋬","nLtv":"≪̸","nmid":"∤","NoBreak":"⁠","NonBreakingSpace":" ","nopf":"𝕟","Nopf":"ℕ","Not":"⫬","not":"¬","NotCongruent":"≢","NotCupCap":"≭","NotDoubleVerticalBar":"∦","NotElement":"∉","NotEqual":"≠","NotEqualTilde":"≂̸","NotExists":"∄","NotGreater":"≯","NotGreaterEqual":"≱","NotGreaterFullEqual":"≧̸","NotGreaterGreater":"≫̸","NotGreaterLess":"≹","NotGreaterSlantEqual":"⩾̸","NotGreaterTilde":"≵","NotHumpDownHump":"≎̸","NotHumpEqual":"≏̸","notin":"∉","notindot":"⋵̸","notinE":"⋹̸","notinva":"∉","notinvb":"⋷","notinvc":"⋶","NotLeftTriangleBar":"⧏̸","NotLeftTriangle":"⋪","NotLeftTriangleEqual":"⋬","NotLess":"≮","NotLessEqual":"≰","NotLessGreater":"≸","NotLessLess":"≪̸","NotLessSlantEqual":"⩽̸","NotLessTilde":"≴","NotNestedGreaterGreater":"⪢̸","NotNestedLessLess":"⪡̸","notni":"∌","notniva":"∌","notnivb":"⋾","notnivc":"⋽","NotPrecedes":"⊀","NotPrecedesEqual":"⪯̸","NotPrecedesSlantEqual":"⋠","NotReverseElement":"∌","NotRightTriangleBar":"⧐̸","NotRightTriangle":"⋫","NotRightTriangleEqual":"⋭","NotSquareSubset":"⊏̸","NotSquareSubsetEqual":"⋢","NotSquareSuperset":"⊐̸","NotSquareSupersetEqual":"⋣","NotSubset":"⊂⃒","NotSubsetEqual":"⊈","NotSucceeds":"⊁","NotSucceedsEqual":"⪰̸","NotSucceedsSlantEqual":"⋡","NotSucceedsTilde":"≿̸","NotSuperset":"⊃⃒","NotSupersetEqual":"⊉","NotTilde":"≁","NotTildeEqual":"≄","NotTildeFullEqual":"≇","NotTildeTilde":"≉","NotVerticalBar":"∤","nparallel":"∦","npar":"∦","nparsl":"⫽⃥","npart":"∂̸","npolint":"⨔","npr":"⊀","nprcue":"⋠","nprec":"⊀","npreceq":"⪯̸","npre":"⪯̸","nrarrc":"⤳̸","nrarr":"↛","nrArr":"⇏","nrarrw":"↝̸","nrightarrow":"↛","nRightarrow":"⇏","nrtri":"⋫","nrtrie":"⋭","nsc":"⊁","nsccue":"⋡","nsce":"⪰̸","Nscr":"𝒩","nscr":"𝓃","nshortmid":"∤","nshortparallel":"∦","nsim":"≁","nsime":"≄","nsimeq":"≄","nsmid":"∤","nspar":"∦","nsqsube":"⋢","nsqsupe":"⋣","nsub":"⊄","nsubE":"⫅̸","nsube":"⊈","nsubset":"⊂⃒","nsubseteq":"⊈","nsubseteqq":"⫅̸","nsucc":"⊁","nsucceq":"⪰̸","nsup":"⊅","nsupE":"⫆̸","nsupe":"⊉","nsupset":"⊃⃒","nsupseteq":"⊉","nsupseteqq":"⫆̸","ntgl":"≹","Ntilde":"Ñ","ntilde":"ñ","ntlg":"≸","ntriangleleft":"⋪","ntrianglelefteq":"⋬","ntriangleright":"⋫","ntrianglerighteq":"⋭","Nu":"Ν","nu":"ν","num":"#","numero":"№","numsp":" ","nvap":"≍⃒","nvdash":"⊬","nvDash":"⊭","nVdash":"⊮","nVDash":"⊯","nvge":"≥⃒","nvgt":">⃒","nvHarr":"⤄","nvinfin":"⧞","nvlArr":"⤂","nvle":"≤⃒","nvlt":"<⃒","nvltrie":"⊴⃒","nvrArr":"⤃","nvrtrie":"⊵⃒","nvsim":"∼⃒","nwarhk":"⤣","nwarr":"↖","nwArr":"⇖","nwarrow":"↖","nwnear":"⤧","Oacute":"Ó","oacute":"ó","oast":"⊛","Ocirc":"Ô","ocirc":"ô","ocir":"⊚","Ocy":"О","ocy":"о","odash":"⊝","Odblac":"Ő","odblac":"ő","odiv":"⨸","odot":"⊙","odsold":"⦼","OElig":"Œ","oelig":"œ","ofcir":"⦿","Ofr":"𝔒","ofr":"𝔬","ogon":"˛","Ograve":"Ò","ograve":"ò","ogt":"⧁","ohbar":"⦵","ohm":"Ω","oint":"∮","olarr":"↺","olcir":"⦾","olcross":"⦻","oline":"‾","olt":"⧀","Omacr":"Ō","omacr":"ō","Omega":"Ω","omega":"ω","Omicron":"Ο","omicron":"ο","omid":"⦶","ominus":"⊖","Oopf":"𝕆","oopf":"𝕠","opar":"⦷","OpenCurlyDoubleQuote":"“","OpenCurlyQuote":"‘","operp":"⦹","oplus":"⊕","orarr":"↻","Or":"⩔","or":"∨","ord":"⩝","order":"ℴ","orderof":"ℴ","ordf":"ª","ordm":"º","origof":"⊶","oror":"⩖","orslope":"⩗","orv":"⩛","oS":"Ⓢ","Oscr":"𝒪","oscr":"ℴ","Oslash":"Ø","oslash":"ø","osol":"⊘","Otilde":"Õ","otilde":"õ","otimesas":"⨶","Otimes":"⨷","otimes":"⊗","Ouml":"Ö","ouml":"ö","ovbar":"⌽","OverBar":"‾","OverBrace":"⏞","OverBracket":"⎴","OverParenthesis":"⏜","para":"¶","parallel":"∥","par":"∥","parsim":"⫳","parsl":"⫽","part":"∂","PartialD":"∂","Pcy":"П","pcy":"п","percnt":"%","period":".","permil":"‰","perp":"⊥","pertenk":"‱","Pfr":"𝔓","pfr":"𝔭","Phi":"Φ","phi":"φ","phiv":"ϕ","phmmat":"ℳ","phone":"☎","Pi":"Π","pi":"π","pitchfork":"⋔","piv":"ϖ","planck":"ℏ","planckh":"ℎ","plankv":"ℏ","plusacir":"⨣","plusb":"⊞","pluscir":"⨢","plus":"+","plusdo":"∔","plusdu":"⨥","pluse":"⩲","PlusMinus":"±","plusmn":"±","plussim":"⨦","plustwo":"⨧","pm":"±","Poincareplane":"ℌ","pointint":"⨕","popf":"𝕡","Popf":"ℙ","pound":"£","prap":"⪷","Pr":"⪻","pr":"≺","prcue":"≼","precapprox":"⪷","prec":"≺","preccurlyeq":"≼","Precedes":"≺","PrecedesEqual":"⪯","PrecedesSlantEqual":"≼","PrecedesTilde":"≾","preceq":"⪯","precnapprox":"⪹","precneqq":"⪵","precnsim":"⋨","pre":"⪯","prE":"⪳","precsim":"≾","prime":"′","Prime":"″","primes":"ℙ","prnap":"⪹","prnE":"⪵","prnsim":"⋨","prod":"∏","Product":"∏","profalar":"⌮","profline":"⌒","profsurf":"⌓","prop":"∝","Proportional":"∝","Proportion":"∷","propto":"∝","prsim":"≾","prurel":"⊰","Pscr":"𝒫","pscr":"𝓅","Psi":"Ψ","psi":"ψ","puncsp":" ","Qfr":"𝔔","qfr":"𝔮","qint":"⨌","qopf":"𝕢","Qopf":"ℚ","qprime":"⁗","Qscr":"𝒬","qscr":"𝓆","quaternions":"ℍ","quatint":"⨖","quest":"?","questeq":"≟","quot":"\\"","QUOT":"\\"","rAarr":"⇛","race":"∽̱","Racute":"Ŕ","racute":"ŕ","radic":"√","raemptyv":"⦳","rang":"⟩","Rang":"⟫","rangd":"⦒","range":"⦥","rangle":"⟩","raquo":"»","rarrap":"⥵","rarrb":"⇥","rarrbfs":"⤠","rarrc":"⤳","rarr":"→","Rarr":"↠","rArr":"⇒","rarrfs":"⤞","rarrhk":"↪","rarrlp":"↬","rarrpl":"⥅","rarrsim":"⥴","Rarrtl":"⤖","rarrtl":"↣","rarrw":"↝","ratail":"⤚","rAtail":"⤜","ratio":"∶","rationals":"ℚ","rbarr":"⤍","rBarr":"⤏","RBarr":"⤐","rbbrk":"❳","rbrace":"}","rbrack":"]","rbrke":"⦌","rbrksld":"⦎","rbrkslu":"⦐","Rcaron":"Ř","rcaron":"ř","Rcedil":"Ŗ","rcedil":"ŗ","rceil":"⌉","rcub":"}","Rcy":"Р","rcy":"р","rdca":"⤷","rdldhar":"⥩","rdquo":"”","rdquor":"”","rdsh":"↳","real":"ℜ","realine":"ℛ","realpart":"ℜ","reals":"ℝ","Re":"ℜ","rect":"▭","reg":"®","REG":"®","ReverseElement":"∋","ReverseEquilibrium":"⇋","ReverseUpEquilibrium":"⥯","rfisht":"⥽","rfloor":"⌋","rfr":"𝔯","Rfr":"ℜ","rHar":"⥤","rhard":"⇁","rharu":"⇀","rharul":"⥬","Rho":"Ρ","rho":"ρ","rhov":"ϱ","RightAngleBracket":"⟩","RightArrowBar":"⇥","rightarrow":"→","RightArrow":"→","Rightarrow":"⇒","RightArrowLeftArrow":"⇄","rightarrowtail":"↣","RightCeiling":"⌉","RightDoubleBracket":"⟧","RightDownTeeVector":"⥝","RightDownVectorBar":"⥕","RightDownVector":"⇂","RightFloor":"⌋","rightharpoondown":"⇁","rightharpoonup":"⇀","rightleftarrows":"⇄","rightleftharpoons":"⇌","rightrightarrows":"⇉","rightsquigarrow":"↝","RightTeeArrow":"↦","RightTee":"⊢","RightTeeVector":"⥛","rightthreetimes":"⋌","RightTriangleBar":"⧐","RightTriangle":"⊳","RightTriangleEqual":"⊵","RightUpDownVector":"⥏","RightUpTeeVector":"⥜","RightUpVectorBar":"⥔","RightUpVector":"↾","RightVectorBar":"⥓","RightVector":"⇀","ring":"˚","risingdotseq":"≓","rlarr":"⇄","rlhar":"⇌","rlm":"‏","rmoustache":"⎱","rmoust":"⎱","rnmid":"⫮","roang":"⟭","roarr":"⇾","robrk":"⟧","ropar":"⦆","ropf":"𝕣","Ropf":"ℝ","roplus":"⨮","rotimes":"⨵","RoundImplies":"⥰","rpar":")","rpargt":"⦔","rppolint":"⨒","rrarr":"⇉","Rrightarrow":"⇛","rsaquo":"›","rscr":"𝓇","Rscr":"ℛ","rsh":"↱","Rsh":"↱","rsqb":"]","rsquo":"’","rsquor":"’","rthree":"⋌","rtimes":"⋊","rtri":"▹","rtrie":"⊵","rtrif":"▸","rtriltri":"⧎","RuleDelayed":"⧴","ruluhar":"⥨","rx":"℞","Sacute":"Ś","sacute":"ś","sbquo":"‚","scap":"⪸","Scaron":"Š","scaron":"š","Sc":"⪼","sc":"≻","sccue":"≽","sce":"⪰","scE":"⪴","Scedil":"Ş","scedil":"ş","Scirc":"Ŝ","scirc":"ŝ","scnap":"⪺","scnE":"⪶","scnsim":"⋩","scpolint":"⨓","scsim":"≿","Scy":"С","scy":"с","sdotb":"⊡","sdot":"⋅","sdote":"⩦","searhk":"⤥","searr":"↘","seArr":"⇘","searrow":"↘","sect":"§","semi":";","seswar":"⤩","setminus":"∖","setmn":"∖","sext":"✶","Sfr":"𝔖","sfr":"𝔰","sfrown":"⌢","sharp":"♯","SHCHcy":"Щ","shchcy":"щ","SHcy":"Ш","shcy":"ш","ShortDownArrow":"↓","ShortLeftArrow":"←","shortmid":"∣","shortparallel":"∥","ShortRightArrow":"→","ShortUpArrow":"↑","shy":"­","Sigma":"Σ","sigma":"σ","sigmaf":"ς","sigmav":"ς","sim":"∼","simdot":"⩪","sime":"≃","simeq":"≃","simg":"⪞","simgE":"⪠","siml":"⪝","simlE":"⪟","simne":"≆","simplus":"⨤","simrarr":"⥲","slarr":"←","SmallCircle":"∘","smallsetminus":"∖","smashp":"⨳","smeparsl":"⧤","smid":"∣","smile":"⌣","smt":"⪪","smte":"⪬","smtes":"⪬︀","SOFTcy":"Ь","softcy":"ь","solbar":"⌿","solb":"⧄","sol":"/","Sopf":"𝕊","sopf":"𝕤","spades":"♠","spadesuit":"♠","spar":"∥","sqcap":"⊓","sqcaps":"⊓︀","sqcup":"⊔","sqcups":"⊔︀","Sqrt":"√","sqsub":"⊏","sqsube":"⊑","sqsubset":"⊏","sqsubseteq":"⊑","sqsup":"⊐","sqsupe":"⊒","sqsupset":"⊐","sqsupseteq":"⊒","square":"□","Square":"□","SquareIntersection":"⊓","SquareSubset":"⊏","SquareSubsetEqual":"⊑","SquareSuperset":"⊐","SquareSupersetEqual":"⊒","SquareUnion":"⊔","squarf":"▪","squ":"□","squf":"▪","srarr":"→","Sscr":"𝒮","sscr":"𝓈","ssetmn":"∖","ssmile":"⌣","sstarf":"⋆","Star":"⋆","star":"☆","starf":"★","straightepsilon":"ϵ","straightphi":"ϕ","strns":"¯","sub":"⊂","Sub":"⋐","subdot":"⪽","subE":"⫅","sube":"⊆","subedot":"⫃","submult":"⫁","subnE":"⫋","subne":"⊊","subplus":"⪿","subrarr":"⥹","subset":"⊂","Subset":"⋐","subseteq":"⊆","subseteqq":"⫅","SubsetEqual":"⊆","subsetneq":"⊊","subsetneqq":"⫋","subsim":"⫇","subsub":"⫕","subsup":"⫓","succapprox":"⪸","succ":"≻","succcurlyeq":"≽","Succeeds":"≻","SucceedsEqual":"⪰","SucceedsSlantEqual":"≽","SucceedsTilde":"≿","succeq":"⪰","succnapprox":"⪺","succneqq":"⪶","succnsim":"⋩","succsim":"≿","SuchThat":"∋","sum":"∑","Sum":"∑","sung":"♪","sup1":"¹","sup2":"²","sup3":"³","sup":"⊃","Sup":"⋑","supdot":"⪾","supdsub":"⫘","supE":"⫆","supe":"⊇","supedot":"⫄","Superset":"⊃","SupersetEqual":"⊇","suphsol":"⟉","suphsub":"⫗","suplarr":"⥻","supmult":"⫂","supnE":"⫌","supne":"⊋","supplus":"⫀","supset":"⊃","Supset":"⋑","supseteq":"⊇","supseteqq":"⫆","supsetneq":"⊋","supsetneqq":"⫌","supsim":"⫈","supsub":"⫔","supsup":"⫖","swarhk":"⤦","swarr":"↙","swArr":"⇙","swarrow":"↙","swnwar":"⤪","szlig":"ß","Tab":"\\t","target":"⌖","Tau":"Τ","tau":"τ","tbrk":"⎴","Tcaron":"Ť","tcaron":"ť","Tcedil":"Ţ","tcedil":"ţ","Tcy":"Т","tcy":"т","tdot":"⃛","telrec":"⌕","Tfr":"𝔗","tfr":"𝔱","there4":"∴","therefore":"∴","Therefore":"∴","Theta":"Θ","theta":"θ","thetasym":"ϑ","thetav":"ϑ","thickapprox":"≈","thicksim":"∼","ThickSpace":"  ","ThinSpace":" ","thinsp":" ","thkap":"≈","thksim":"∼","THORN":"Þ","thorn":"þ","tilde":"˜","Tilde":"∼","TildeEqual":"≃","TildeFullEqual":"≅","TildeTilde":"≈","timesbar":"⨱","timesb":"⊠","times":"×","timesd":"⨰","tint":"∭","toea":"⤨","topbot":"⌶","topcir":"⫱","top":"⊤","Topf":"𝕋","topf":"𝕥","topfork":"⫚","tosa":"⤩","tprime":"‴","trade":"™","TRADE":"™","triangle":"▵","triangledown":"▿","triangleleft":"◃","trianglelefteq":"⊴","triangleq":"≜","triangleright":"▹","trianglerighteq":"⊵","tridot":"◬","trie":"≜","triminus":"⨺","TripleDot":"⃛","triplus":"⨹","trisb":"⧍","tritime":"⨻","trpezium":"⏢","Tscr":"𝒯","tscr":"𝓉","TScy":"Ц","tscy":"ц","TSHcy":"Ћ","tshcy":"ћ","Tstrok":"Ŧ","tstrok":"ŧ","twixt":"≬","twoheadleftarrow":"↞","twoheadrightarrow":"↠","Uacute":"Ú","uacute":"ú","uarr":"↑","Uarr":"↟","uArr":"⇑","Uarrocir":"⥉","Ubrcy":"Ў","ubrcy":"ў","Ubreve":"Ŭ","ubreve":"ŭ","Ucirc":"Û","ucirc":"û","Ucy":"У","ucy":"у","udarr":"⇅","Udblac":"Ű","udblac":"ű","udhar":"⥮","ufisht":"⥾","Ufr":"𝔘","ufr":"𝔲","Ugrave":"Ù","ugrave":"ù","uHar":"⥣","uharl":"↿","uharr":"↾","uhblk":"▀","ulcorn":"⌜","ulcorner":"⌜","ulcrop":"⌏","ultri":"◸","Umacr":"Ū","umacr":"ū","uml":"¨","UnderBar":"_","UnderBrace":"⏟","UnderBracket":"⎵","UnderParenthesis":"⏝","Union":"⋃","UnionPlus":"⊎","Uogon":"Ų","uogon":"ų","Uopf":"𝕌","uopf":"𝕦","UpArrowBar":"⤒","uparrow":"↑","UpArrow":"↑","Uparrow":"⇑","UpArrowDownArrow":"⇅","updownarrow":"↕","UpDownArrow":"↕","Updownarrow":"⇕","UpEquilibrium":"⥮","upharpoonleft":"↿","upharpoonright":"↾","uplus":"⊎","UpperLeftArrow":"↖","UpperRightArrow":"↗","upsi":"υ","Upsi":"ϒ","upsih":"ϒ","Upsilon":"Υ","upsilon":"υ","UpTeeArrow":"↥","UpTee":"⊥","upuparrows":"⇈","urcorn":"⌝","urcorner":"⌝","urcrop":"⌎","Uring":"Ů","uring":"ů","urtri":"◹","Uscr":"𝒰","uscr":"𝓊","utdot":"⋰","Utilde":"Ũ","utilde":"ũ","utri":"▵","utrif":"▴","uuarr":"⇈","Uuml":"Ü","uuml":"ü","uwangle":"⦧","vangrt":"⦜","varepsilon":"ϵ","varkappa":"ϰ","varnothing":"∅","varphi":"ϕ","varpi":"ϖ","varpropto":"∝","varr":"↕","vArr":"⇕","varrho":"ϱ","varsigma":"ς","varsubsetneq":"⊊︀","varsubsetneqq":"⫋︀","varsupsetneq":"⊋︀","varsupsetneqq":"⫌︀","vartheta":"ϑ","vartriangleleft":"⊲","vartriangleright":"⊳","vBar":"⫨","Vbar":"⫫","vBarv":"⫩","Vcy":"В","vcy":"в","vdash":"⊢","vDash":"⊨","Vdash":"⊩","VDash":"⊫","Vdashl":"⫦","veebar":"⊻","vee":"∨","Vee":"⋁","veeeq":"≚","vellip":"⋮","verbar":"|","Verbar":"‖","vert":"|","Vert":"‖","VerticalBar":"∣","VerticalLine":"|","VerticalSeparator":"❘","VerticalTilde":"≀","VeryThinSpace":" ","Vfr":"𝔙","vfr":"𝔳","vltri":"⊲","vnsub":"⊂⃒","vnsup":"⊃⃒","Vopf":"𝕍","vopf":"𝕧","vprop":"∝","vrtri":"⊳","Vscr":"𝒱","vscr":"𝓋","vsubnE":"⫋︀","vsubne":"⊊︀","vsupnE":"⫌︀","vsupne":"⊋︀","Vvdash":"⊪","vzigzag":"⦚","Wcirc":"Ŵ","wcirc":"ŵ","wedbar":"⩟","wedge":"∧","Wedge":"⋀","wedgeq":"≙","weierp":"℘","Wfr":"𝔚","wfr":"𝔴","Wopf":"𝕎","wopf":"𝕨","wp":"℘","wr":"≀","wreath":"≀","Wscr":"𝒲","wscr":"𝓌","xcap":"⋂","xcirc":"◯","xcup":"⋃","xdtri":"▽","Xfr":"𝔛","xfr":"𝔵","xharr":"⟷","xhArr":"⟺","Xi":"Ξ","xi":"ξ","xlarr":"⟵","xlArr":"⟸","xmap":"⟼","xnis":"⋻","xodot":"⨀","Xopf":"𝕏","xopf":"𝕩","xoplus":"⨁","xotime":"⨂","xrarr":"⟶","xrArr":"⟹","Xscr":"𝒳","xscr":"𝓍","xsqcup":"⨆","xuplus":"⨄","xutri":"△","xvee":"⋁","xwedge":"⋀","Yacute":"Ý","yacute":"ý","YAcy":"Я","yacy":"я","Ycirc":"Ŷ","ycirc":"ŷ","Ycy":"Ы","ycy":"ы","yen":"¥","Yfr":"𝔜","yfr":"𝔶","YIcy":"Ї","yicy":"ї","Yopf":"𝕐","yopf":"𝕪","Yscr":"𝒴","yscr":"𝓎","YUcy":"Ю","yucy":"ю","yuml":"ÿ","Yuml":"Ÿ","Zacute":"Ź","zacute":"ź","Zcaron":"Ž","zcaron":"ž","Zcy":"З","zcy":"з","Zdot":"Ż","zdot":"ż","zeetrf":"ℨ","ZeroWidthSpace":"​","Zeta":"Ζ","zeta":"ζ","zfr":"𝔷","Zfr":"ℨ","ZHcy":"Ж","zhcy":"ж","zigrarr":"⇝","zopf":"𝕫","Zopf":"ℤ","Zscr":"𝒵","zscr":"𝓏","zwj":"‍","zwnj":"‌"}');

/***/ }),

/***/ "./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/maps/legacy.json":
/*!**************************************************************************************!*\
  !*** ./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/maps/legacy.json ***!
  \**************************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('{"Aacute":"Á","aacute":"á","Acirc":"Â","acirc":"â","acute":"´","AElig":"Æ","aelig":"æ","Agrave":"À","agrave":"à","amp":"&","AMP":"&","Aring":"Å","aring":"å","Atilde":"Ã","atilde":"ã","Auml":"Ä","auml":"ä","brvbar":"¦","Ccedil":"Ç","ccedil":"ç","cedil":"¸","cent":"¢","copy":"©","COPY":"©","curren":"¤","deg":"°","divide":"÷","Eacute":"É","eacute":"é","Ecirc":"Ê","ecirc":"ê","Egrave":"È","egrave":"è","ETH":"Ð","eth":"ð","Euml":"Ë","euml":"ë","frac12":"½","frac14":"¼","frac34":"¾","gt":">","GT":">","Iacute":"Í","iacute":"í","Icirc":"Î","icirc":"î","iexcl":"¡","Igrave":"Ì","igrave":"ì","iquest":"¿","Iuml":"Ï","iuml":"ï","laquo":"«","lt":"<","LT":"<","macr":"¯","micro":"µ","middot":"·","nbsp":" ","not":"¬","Ntilde":"Ñ","ntilde":"ñ","Oacute":"Ó","oacute":"ó","Ocirc":"Ô","ocirc":"ô","Ograve":"Ò","ograve":"ò","ordf":"ª","ordm":"º","Oslash":"Ø","oslash":"ø","Otilde":"Õ","otilde":"õ","Ouml":"Ö","ouml":"ö","para":"¶","plusmn":"±","pound":"£","quot":"\\"","QUOT":"\\"","raquo":"»","reg":"®","REG":"®","sect":"§","shy":"­","sup1":"¹","sup2":"²","sup3":"³","szlig":"ß","THORN":"Þ","thorn":"þ","times":"×","Uacute":"Ú","uacute":"ú","Ucirc":"Û","ucirc":"û","Ugrave":"Ù","ugrave":"ù","uml":"¨","Uuml":"Ü","uuml":"ü","Yacute":"Ý","yacute":"ý","yen":"¥","yuml":"ÿ"}');

/***/ }),

/***/ "./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/maps/xml.json":
/*!***********************************************************************************!*\
  !*** ./node_modules/.pnpm/entities@2.2.0/node_modules/entities/lib/maps/xml.json ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('{"amp":"&","apos":"\'","gt":">","lt":"<","quot":"\\""}');

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module used 'module' so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./index.js");
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=rss-parser.js.map