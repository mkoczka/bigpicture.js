/*
 * bigpicture.js
 *
 * bigpicture.js is a library that allows infinite panning and infinite zooming in HTML pages. 
 *               See it in action on http://www.bigpicture.bi/demo !
 *
 * ------------------------------------------------
 *  author:  Joseph Ernest (twitter: @JosephErnest)
 *  url:     http://github.com/josephernest/bigpicture.js
 *  website: http://www.bigpicture.bi/demo 
 *   
 */

var bigpicture = (function() {
  "use strict";

  /*
   * INITIALIZATION  
   */
   
  document.body.setAttribute('spellcheck', false);

  var bpContainer = document.getElementById('bigpicture-container'),
    bp = document.getElementById('bigpicture');

  if (!bp) return;

  var current = {x: $(bp).data('x'), y: $(bp).data('y'), zoom: $(bp).data('zoom')};

  bp.x = 0; bp.y = 0;
  bp.updateContainerPosition = function() { bp.style.left = bp.x + 'px'; bp.style.top = bp.y + 'px'; };
  
  /*
   * TEXT BOXES
   */            
   
  $(".text").each(function() { updateTextPosition(this); });     // initialization   
   
  $(bp).on('blur', '.text', function() { if ($(this).text().replace(/^\s+|\s+$/g, '') == '') { $(this).remove(); }; });
  
  $(bp).on('input', '.text', function() { redosearch = true; });   
   
  function isContainedByClass(e, cls) { while (e && e.tagName) { if (e.classList.contains(cls)) return true; e = e.parentNode; } return false; }
  
  function updateTextPosition(e) { 
    e.style.fontSize = $(e).data("size") / current.zoom + 'px';
    e.style.left = ($(e).data("x") - current.x) / current.zoom - bp.x + 'px';
    e.style.top = ($(e).data("y") - current.y) / current.zoom - bp.y + 'px';
  };
  
  function newText(x, y, size, text) {
    var tb = document.createElement('div');
    tb.className = "text";
    tb.contentEditable = true;
	tb.innerHTML = text;
    $(tb).data("x", x).data("y", y).data("size", size);
    updateTextPosition(tb);
    bp.appendChild(tb);
	return tb;
  }
   
  bpContainer.onclick = function(e) {
    if (isContainedByClass(e.target, 'text')) return;
    newText(current.x + (e.clientX) * current.zoom, current.y + (e.clientY) * current.zoom, 20 * current.zoom, '').focus();
  }
  
  /*
   * PAN AND MOVE  
   */
  
  var movingText = null,
    dragging = false,
    previousMousePosition;
  
  bpContainer.onmousedown = function(e) {
    if ($(e.target).hasClass('text') && (e.ctrlKey || e.metaKey)) {
      movingText = e.target;
      movingText.className = "text noselect notransition";
    }
    else {
      movingText = null;
      dragging = true;
    }
    biggestpictureseen = false;
    previousMousePosition = {x: e.pageX, y: e.pageY};
  }
  
  window.onmouseup = function() {
    dragging = false;
    if (movingText) movingText.className = "text";
    movingText = null;
  }
  
  bpContainer.ondragstart = function(e) {
    e.preventDefault();
  }

  bpContainer.onmousemove = function(e) {
    if (dragging) {
      bp.style.transitionDuration = "0s";
      bp.x += e.pageX - previousMousePosition.x;
      bp.y += e.pageY - previousMousePosition.y;
      bp.updateContainerPosition();
      current.x -= (e.pageX - previousMousePosition.x) * current.zoom;
      current.y -= (e.pageY - previousMousePosition.y) * current.zoom;
      previousMousePosition = {x: e.pageX, y: e.pageY};
    }
    if (movingText) {
      $(movingText).data("x", $(movingText).data("x") + (e.pageX - previousMousePosition.x) * current.zoom);
      $(movingText).data("y", $(movingText).data("y") + (e.pageY - previousMousePosition.y) * current.zoom);
      updateTextPosition(movingText);
      previousMousePosition = {x: e.pageX, y: e.pageY};
    }
  }
  
  /*
   * ZOOM
   */
  
  bpContainer.ondblclick = function(e) {       
    e.preventDefault();
    onzoom(e.ctrlKey ? current.zoom * 1.7 * 1.7 : current.zoom / 1.7 / 1.7, current.x + e.clientX * current.zoom, current.y + e.clientY * current.zoom, e.clientX, e.clientY);
  }
  
  var biggestpictureseen = false, 
    previous;    

  function onzoom(zoom, wx, wy, sx, sy) {  // zoom on (wx, wy) (world coordinates) which will be placed on (sx, sy) (screen coordinates)
    wx = (typeof wx === "undefined") ? current.x + window.innerWidth / 2 * current.zoom : wx;
    wy = (typeof wy === "undefined") ? current.y + window.innerHeight / 2 * current.zoom : wy;
    sx = (typeof sx === "undefined") ? window.innerWidth / 2  : sx;
    sy = (typeof sy === "undefined") ? window.innerHeight / 2 : sy;  
  
    bp.style.transitionDuration = "0.2s";      

    bp.x = 0, bp.y = 0; bp.updateContainerPosition();
    current = {x: wx - sx * zoom, y: wy - sy * zoom, zoom: zoom};

    $(".text").each(function() { updateTextPosition(this); });
    
    biggestpictureseen = false;
  }
  
  function zoomontext(res) {
    onzoom($(res).data('size') / 20, $(res).data('x'), $(res).data('y'));        
  }
  
  function seethebigpicture(e) {
    e.preventDefault();
    document.activeElement.blur();  
    function universeboundingrect() {
      var minX = Infinity, maxX = - Infinity, minY = Infinity, maxY = - Infinity;
      var texteelements = document.getElementsByClassName('text');
      [].forEach.call(texteelements, function(elt) {
        var rect2 = elt.getBoundingClientRect();
        var rect = {left: $(elt).data("x"), 
                    top: $(elt).data("y"), 
                    right: (rect2.width > 2 && rect2.width < 10000) ? current.x + rect2.right * current.zoom : $(elt).data("x") + 300 * $(elt).data("size") / 20, 
                    bottom: (rect2.height > 2 && rect2.height < 10000) ? current.y + rect2.bottom * current.zoom : $(elt).data("y") + 100 * $(elt).data("size") / 20 };
        if (rect.left < minX)  minX = rect.left; 
        if (rect.right > maxX) maxX = rect.right; 
        if (rect.top < minY)  minY = rect.top; 
        if (rect.bottom > maxY) maxY = rect.bottom; 
      });
      return {minX: minX, maxX: maxX, minY: minY, maxY: maxY};
    }
  
    var texts = document.getElementsByClassName('text');
    if (texts.length == 0) return;
    if (texts.length == 1) { zoomontext(texts[0]); return; }
  
    if (!biggestpictureseen) {
      previous = {x: current.x, y: current.y, zoom: current.zoom};
      var rect = universeboundingrect();
      var zoom = Math.max((rect.maxX - rect.minX) / window.innerWidth, (rect.maxY - rect.minY) / window.innerHeight) * 1.1;
      onzoom(zoom, (rect.minX + rect.maxX) / 2, (rect.minY + rect.maxY) / 2);
      biggestpictureseen = true; 
    }
    else {
      onzoom(previous.zoom, previous.x, previous.y, 0, 0);
      biggestpictureseen = false;
    }
  }
 
  /*
   * SEARCH
   */
   
  var results = {index: -1, elements: [], text: ""},
    redosearch = true,
    query;
  
  function find(txt) {
    results = {index: -1, elements: [], text: txt};
    $(".text").each(function(index) {
      if ($(this).text().toLowerCase().indexOf(txt.toLowerCase()) != -1) 
        results.elements.push(this);
    });          
    if (results.elements.length > 0) results.index = 0;
  }
  
  function findnext(txt) {
    if (txt.replace(/^\s+|\s+$/g, '') == '')  // empty search
      return;
    if (results.index == -1 || results.text != txt || redosearch) {
      find(txt);                        
      if (results.index == -1) return;       // still no results
      redosearch = false;
    }
    var res = results.elements[results.index];
    zoomontext(res);
    results.index += 1;
    if (results.index == results.elements.length) results.index = 0;  // loop 
  }
  
  /*
   * MOUSEWHEEL 
   */
        
  var mousewheeltime = new Date(), mousewheeldelta = 0, last_e, mousewheeltimer = null;

  if (navigator.appVersion.indexOf("Mac") != -1) {   // Mac OS X     
    var mousewheel = function(e) {
      e.preventDefault();
      mousewheeldelta += Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail))); 
      last_e = e;
      if (!mousewheeltimer)
        mousewheeltimer = setTimeout(function() {
          onzoom((mousewheeldelta > 0) ? current.zoom / 1.7 : current.zoom * 1.7, current.x + last_e.clientX * current.zoom, current.y + last_e.clientY * current.zoom, last_e.clientX, last_e.clientY);
          mousewheeldelta = 0;
          mousewheeltimer = null; }, 70);
    }
  } 
  else {
    var mousewheel = function(e) {            
      e.preventDefault();
      var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
      onzoom((delta > 0) ? current.zoom / 1.7 : current.zoom * 1.7, current.x + e.clientX * current.zoom, current.y + e.clientY * current.zoom, e.clientX, e.clientY);
    }
  }
  
  if ("onmousewheel" in document)
    document.onmousewheel = mousewheel;
  else
    document.addEventListener('DOMMouseScroll', mousewheel, false);
  
    /*
   * KEYBOARD SHORTCUTS
   */
    
  window.onkeydown = function(e) {
    if (((e.ctrlKey || e.metaKey) && (e.keyCode == 61 || e.keyCode == 187 || e.keyCode == 171 || e.keyCode == 107 || e.key == '+' || e.key == '=' ))   // CTRL+PLUS or COMMAND+PLUS
    || e.keyCode == 34) {   // PAGE DOWN
      e.preventDefault();
      onzoom(current.zoom / 1.7);
      return;
    }
    if (((e.ctrlKey || e.metaKey) && (e.keyCode == 54 || e.keyCode == 189 || e.keyCode == 173 || e.keyCode == 167 || e.keyCode == 109 || e.keyCode == 169 || e.keyCode == 219 || e.key == '-' ))   // CTRL+MINUS or COMMAND+MINUS   
    || e.keyCode == 33) {   // PAGE UP
      e.preventDefault();
      onzoom(current.zoom * 1.7);
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.keyCode == 70) {         // CTRL+F
      e.preventDefault();
      query = window.prompt("What are you looking for?", "");
      findnext(query);
      return;
    } 
    if (e.keyCode == 114) {                 // F3
      e.preventDefault();
      if (results.index == -1) query = window.prompt("What are you looking for?", "");
      findnext(query);
      return;
    }
    if (e.keyCode == 113) {                 // F2
      e.preventDefault();
      seethebigpicture(e);
      return;
    }
  } 
  
  /*
   * API
   */  
   
   return { newText: newText }
  
})();