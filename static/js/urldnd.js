define([
	'jquery'
	, 'underscore'
],
function(
	$
	, _
) {

	// URLDnD class's private functions
	var _urlDnD = {

		type: {
			column: 'column'
			, portlet: 'portlet'
		}

		, isColumn: function(node) {
			return node.dataset.type === this.type.column;
		}

		, isPortlet: function(node) {
			return node.dataset.type === this.type.portlet;
		}

		// @param nodes - html nodes list
		// @param size - JSON configuration element {height: xxx, width: xxx, ...}
		, resizeNodes: function(nodes, size) {
			[].forEach.call(nodes, function(node) {
				node.style.height = size.height;
			});
		}

		, resizeColumns: function(columns) {
			var maxColH = 0;

			// find max height
			[].forEach.call(columns, function(column) {
				column.style.height = 'auto';
				maxColH = maxColH > column.offsetHeight ? maxColH : column.offsetHeight;
			});

			// set all columns heights to max height
			this.resizeNodes(columns, {height: maxColH+'px'});
		}

		// Initalizes URLDnD component by generating and returning all component data
		// @param options - component's options (merged defaults & user provided configuration)
		, initialize: function(options) {
			var self = this;
			// Generate 'portal' ID if not specified
			options.portal.id = $.trim(options.portal.id).length ? options.portal.id : _.uniqueId('url-portal-');

			// Portal Columns
			var columns = options.portal ? options.portal.querySelectorAll('.'+options.class.column) : []
				// Portal columns JSON (<{ columndID: column }> for faster access)
				, columnsJson = {}
				, maxColH = 0;

			[].forEach.call(columns, function(column) {
				// 1. Generate each column ID if not specified
				column.id = $.trim(column.id).length ? column.id : _.uniqueId('url-portal-column-');
				// set data-type='portlet'
				column.dataset.type = self.type.column;
				// 2. populate columnsJson
				columnsJson[column.id] = column;
			});

			// Resize portal columns
			self.resizeColumns(columns);

			// Portlets
			var portlets = options.portal.querySelectorAll('.'+options.class.portlet)
				, porletsJson = {};
			[].forEach.call(portlets, function(portlet) {
				// 1. Generate each portlet ID if not specified
				portlet.id = $.trim(portlet.id).length ? portlet.id : _.uniqueId('url-portlet-');
				// set data-type='portlet'
				portlet.dataset.type = self.type.portlet;
				// 2. populate portletsJson
				porletsJson[portlet.id] = portlet;
			});

			// Return Component's internal data structure (used internally by component)
			return {
				portal: options.portal
				, columns: columnsJson
				, portlets: porletsJson
			};
		}

		// Makes portlets as draggable
		// @param portalData - JSON conforming to <URLDnD.data>
		, makeDraggable: function(portalData) {
			var self = this, portlet, column, dnd;

			dnd = {

				handleDragStart: function(e) {
					console.debug('dragstart');

					e.dataTransfer.effectAllowed = 'copy';
					e.dataTransfer.setData('text/plain', this.id);
				}

				, handleDragEnter: function(e) {
					console.debug('dragenter: ', this);

					if (self.isColumn(this)) {
						this.classList.add('over');
					} else if (self.isPortlet(this)) {
						this.parentNode.classList.add('over');
					}
				}

				, handleDragOver: function(e) {
					// console.debug('dragover');

					e.dataTransfer.dropEffect = 'copy';

					// allows us to drop
					e.stopPropagation();
					e.preventDefault();
					return false;
				}

				, handleDragLeave: function(e) {
					console.debug('dragleave: ', this.classList);

					this.classList.remove('over');
				}

				, handleDrop: function(e) {
					console.debug('drop: ', this);
					var id = e.dataTransfer.getData('text/plain')
						, portlet = portalData.portlets[id]
						, column = this;

					// Move portlet from source to targeted column
					portlet.parentNode.removeChild(portlet);
					column.classList.remove('over');
					column.appendChild(portlet);
					
					// Handle column heights
					self.resizeColumns( column.parentNode.querySelectorAll('.url-column') );
					
					e.stopPropagation();
					e.preventDefault();
					return false;
				}
			};
			
			for(var pid in portalData.portlets) {
				portlet = portalData.portlets[pid];
				portlet.addEventListener('dragstart', dnd.handleDragStart, false);
			}

			for(var cid in portalData.columns) {
				column = portalData.columns[cid];
				column.addEventListener('dragenter', dnd.handleDragEnter, false);
				column.addEventListener('dragover', dnd.handleDragOver, false);
				column.addEventListener('dragleave', dnd.handleDragLeave, false);
				column.addEventListener('drop', dnd.handleDrop, false);
			}

		}

	};

	/*
		URLDnD class.
	*/
	var URLDnD = function(config) {
		var defaults = {
				// Root portal element (marked with '.url-portal' selector)
				portal: null
				// CSS classes for portal components
				, class: {
					portal: 'url-portal'
					, column: 'url-column'
					, portlet: 'url-portlet'
				}
			};

		// Class instance options (merged conguration & defaults)
		this.options = $.extend({}, defaults, config, true);

		// Generate component data (used internally)
		this.data = _urlDnD.initialize(this.options);

		// Decorate portlets as draggable
		_urlDnD.makeDraggable(this.data);

	};

	URLDnD.prototype = {

		// @return <[]> of all portal's portlets
		getPortlets: function() {
			var portlets = [];
			for(var pk in this.data.portlets) {
				portlets.push(this.data.portlets[pk]);
			}
			return portlets;
		}

		// @return <[]> of all portal's columns
		, getColumns: function() {
			var columns = [];
			for(var ck in this.data.columns) {
				columns.push(this.data.columns[ck]);
			}
			return columns;
		}

		// @param column<Element> - portal column
		// @return portlets<NodeList> of all portal's column portlets
		, getColumnPortlets: function(column) {
			if (!column) { throw new Erro('URLDnD.getColumnPortlets() requires column as an argument'); }
			return column.querySelectorAll('.'+this.options.class.portlet);
		}
	};


	return URLDnD;
});