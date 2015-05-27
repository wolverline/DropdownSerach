/*
 *  Project: jQuery plugin for dropdown search
 */
;(function ($, window, document, undefined) {
	"use strict";

	var pluginName = "srhdropdown",
		dataKey = "plugin_" + pluginName;

  var Plugin = function(element, options) {
		this.$element = null;
		this.element = element;
		this._name = pluginName;
    this._defaults = $.fn.srhdropdown.defaults;
		this.options = $.extend({}, this._defaults, options);
		this.init(options);
  };

	Plugin.prototype = {
		init: function(options) {
			this.$element = options.useCache ? $(this.element) : this.element;
    	this.bindEvents();
		},
		destroy: function() {
			this.unbindEvents();
			this.$element.removeData();
		},
		// bind events that trigger methods
		bindEvents: function() {
			var plugin = this;
			plugin.$element.find('input.input-name').on('keyup.' + plugin._name, function(evt) {
				var str = $(this).val(),
					code = evt.keyCode || evt.which,
					elem = plugin.$element.find('ul.dropdown-list');
			  switch (code) {
      	case 13:
					if ($(this).is(':focus')) {
						if (str.length > plugin.options.textLimit) {
							plugin.callback(plugin.options.onEnter);
						}
						else {
							if (!plugin.options.expanded) {
								$(this).parent().addClass('error');
							}
						}
					}
   				evt.stopPropagation();
   				break;
      	case 40: // arrow down
	      	plugin.expandDropdown.call(plugin);
   				if (plugin.options.itemCount) {
						var curitem = plugin.findDropdownItem.call(plugin, elem);
						curitem.find('a').focus();
						//plugin.setBrowseItem.call(plugin, curitem);
					}
      	  evt.stopPropagation();
   				break;
   			case 8: // backspace
   			case 46: // delete
 					if (str.length <= plugin.options.textLimit) {
						var elem = plugin.$element.find('ul.dropdown-list');
						plugin.emptyDropdown.call(plugin, elem);
						plugin.collapseDropdown.call(plugin);
						plugin.setItemCount.call(plugin, 0);
					}
   				evt.stopPropagation();
   				break;
      	default:
					var typed = String.fromCharCode(evt.keyCode);
					if (/[a-zA-Z0-9-_ ]/.test(typed)) {
						if (str.length > plugin.options.textLimit) {
							plugin.setSpinner.call(plugin, $(this).parent().children('span'), true);
							plugin.getDropdownData.call(plugin, str);
							plugin.expandDropdown.call(plugin);
							plugin.setSpinner.call(plugin, $(this).parent().children('span'), false);
							$(this).parent().removeClass('error');
						}
					}
				}
			});
			plugin.$element.find('ul.dropdown-list').on('keyup.' + plugin._name, function(evt) {
				var code = evt.keyCode || evt.which;
			  switch (code) {
				case 13: // enter
					var curobj = plugin.$element.find('li.hovering'),
						keyword = curobj.find('a').attr('data-value');
					if (keyword) {
						plugin.setSelectItem.call(plugin, curobj, keyword);
					}
					plugin.collapseDropdown.call(plugin);
         	plugin.$element.find('input.input-name').focus();
         	evt.stopPropagation();
					break;
				case 38: // arrow up
          plugin.expandDropdown.call(plugin);
          if (plugin.options.expanded) {
          	var prev = plugin.findDropdownItem.call(plugin, $(this), true);
          	plugin.setBrowseItem.call(plugin, prev);
          }
					break;			  	
      	case 40: // arrow down
	          plugin.expandDropdown.call(plugin);
          if (plugin.options.expanded) {
          	var next = plugin.findDropdownItem.call(plugin, $(this));
          	plugin.setBrowseItem.call(plugin, next);
          }
					break;
				}
			});
			plugin.$element.find('input.input-name, span.arrow').on('click.' + plugin._name, function() {
				if (plugin.options.expanded) {
					plugin.collapseDropdown.call(plugin);
				}
				else {
					var elem = plugin.$element.find('ul.dropdown-list');
					plugin.expandDropdown.call(plugin);
					if (plugin.options.itemCount) {
						var curitem = plugin.findDropdownItem.call(plugin, elem);
						curitem.find('a').focus();
					}
				}
			});
		},
		// unbind events in plugin's namespace that are attached to "this.$element"
		unbindEvents: function(namespace) {
			if (namespace) {
				this.$element.off('.' + namespace);
			}
			else {
				this.$element.off('.' + this._name);
			}
		},
		// callback function definition
		callback: function(callOption) {
			if (callOption) {
				if (typeof callOption === 'function') {
					callOption.call(this.$element);
				}
			}
		},
		findDropdownItem: function(elem, reverse) {
      var curobj = elem.find('li.hovering');
      if (!curobj.length) {
				curobj = elem.find('li.selected');
      	if (!curobj.length) {
	      	curobj = elem.children().first();
	      }
      }
     	curobj = reverse ? curobj.prev() : curobj.next();
	    if (!curobj.length) {
		  	curobj = reverse ? elem.children().last() : elem.children().first();
  	 	}
      return curobj;
		},		
		// expand dropdown
		expandDropdown: function() {
			if (this.options.itemCount) {
				if (!this.$element.find('div.dropdown-input').hasClass('active')) {
					this.$element.find('ul.dropdown-list').children().removeClass('hovering');
					this.$element.find('div.dropdown-input').addClass('active');
	 				this.$element.find('div.dropdown-input').animate({
	 					scrollTop: this.$element.find('div.dropdown-input').offset().top
	 				}, 'slow');
	 			}
				this.options.expanded = true;
			}
		},
		// expand dropdown
		collapseDropdown: function() {
			if (this.options.itemCount) {
				this.$element.find('ul.dropdown-list').children().removeClass('hovering');
				this.$element.find('div.dropdown-input').removeClass('active');
				this.options.expanded = false;
			}
		},
		// empty list in dropdown
		emptyDropdown: function(elem) {
			elem.empty();
		},
		findItemKey: function(obj, prop, str) {
			var keys = [],
				strTemp = str;
		  for (var key in obj) {
        if ( obj[key].hasOwnProperty(prop) ) {
        	var tempVal = obj[key][prop].toLowerCase();
        	strTemp = strTemp.toLowerCase();
        	if (tempVal.indexOf(strTemp)!== -1) {
	          keys.push({
  	    		  name: obj[key]['name'],
    	    		value: obj[key]['value']
				    });
	        }
        }
    	}
	    return keys;
		},
		// get json data to populate the list
		getDropdownData: function(str) {
			var plugin = this,
				itemData = null;
			if (plugin.options.itemData) {
				var res = plugin.options.itemData;
				itemData = plugin.findItemKey.call(plugin, res.data, 'name', str);
				plugin.setDropdownList.call(plugin, itemData);
			}
			else if (plugin.options.dataUrl) {
				if (plugin.options.usePost) {
					// if you want to POST call, otherwise no need to use it
					var jqxhr = $.ajax({
					  dataType: 'json',
					  url: plugin.options.dataUrl,
					  data: str
					}).done(function(res) {
						itemData = res.data;
						plugin.setDropdownList.call(plugin, itemData);
					});
				}
				else {
					var jqxhr = $.getJSON(this.options.dataUrl);
					jqxhr.done(function(res) {
						itemData = plugin.findItemKey.call(plugin, res.data, 'name', str);
						plugin.setDropdownList.call(plugin, itemData);
					});
				}				
			}
		},
		// display list from json and append items & events
		setDropdownList: function(itemData) {
			var plugin = this,
				elem = plugin.$element.find('ul.dropdown-list');
			if (elem.length) {
				plugin.unbindEvents.call(plugin, plugin._name + '-dditem');
				if (itemData) {
					var html = '',
						itemCount = 0;
					$.each(itemData, function(idx, rec) {
					  html += '<li class="dropdown-item">';
					  html += rec.name ? '<a href="#" data-value="' + rec.name + '">' + rec.name + '</a>' : '';
					  html += rec.value ? '<span class="dropdown-value">' + rec.value + '</span>' : '';
					  html += '</li>';
					  itemCount++;
					});
					plugin.setItemCount.call(plugin, itemCount);
					plugin.emptyDropdown.call(plugin, elem);
					elem.append(html);
					elem.children('li.dropdown-item').on('mouseup.' + plugin._name + '-dditem', function() {
						var keyword = $(this).children('a').attr('data-value');
						if (keyword) {
							plugin.setSelectItem.call(plugin, $(this), keyword);
							plugin.collapseDropdown.call(plugin);
							plugin.$element.find('input.input-name').focus();
						}
					});
				}
			}
		},
		setBrowseItem: function(elem) {
			if (this.options.itemCount) {
				elem.parent().children().removeClass('hovering');
				elem.addClass('hovering');
			}
		},
		// select dropdown
		setSelectItem: function(elem, keyword) {
			if (this.options.itemCount) {
				elem.parent().children().removeClass('selected');
				elem.addClass('selected');
				this.$element.find('input.input-name').val(keyword);
			}
		},		
		setSpinner: function(elem, active) {
			if (this.options.useSpinner) {
				active ? elem.removeClass('arrow').addClass('spinner') : elem.removeClass('spinner').addClass('arrow');
			}
		},
		setItemCount: function(count) {
			this.options.itemCount = count;
		},
	};

	/*
	 * Plugin wrapper, preventing against multiple instantiations and
	 * return plugin instance.
	 */
	$.fn[pluginName] = function(options) {
		var plugin = this.data(dataKey);
		// has plugin instantiated?
		if (plugin instanceof Plugin) {
			// if have options arguments, call plugin.init() again
			if (typeof options !== 'undefined') {
				plugin.init(options);
			}
		} else {
			plugin = new Plugin(this, options);
			this.data(dataKey, plugin);
		}
		return plugin;
	};

  $.fn.srhdropdown.defaults = {
    dataUrl: '',
    itemData: null,
    useSpinner: true,
    useCache: false,
    usePost: false,
    expanded: false,
    itemCount: 0,
    textLimit: 1,
    onComplete: null,
    onEnter: null
  };

}(jQuery, window, document));	
