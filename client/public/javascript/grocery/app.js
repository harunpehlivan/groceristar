/*global blocks */

(function () {
	'use strict';

	var ENTER_KEY  = 13;
	var ESCAPE_KEY = 27;




	var App = blocks.Application();

	var Todo = App.Model({

		// id       : App.Property(),

		title    : App.Property(),

		completed: App.Property(),
		// departmentId: App.Property(),

		editing: blocks.observable(),

		init: function () {
			var collection = this.collection();

			// collection is undefined when a Todo is still not part of the Todos collection
            if (collection) {

	          // save to Local Storage on each attribute change
	          this.title.on('change', collection.save);
	          this.completed.on('change', collection.save);
            }

			this.title.on('change', function (newValue) {
				this.title((newValue || '').trim());
				this.save()
			});
		},

		toggleComplete: function () {
			this.completed(!this.completed());
		},

		edit: function () {
			this.lastValue = this.title();
			this.editing(true);
		},

		closeEdit: function () {
			if (this.title()) {
				this.editing(false);
			} else {
				this.destroy();
			}
		},

		handleAction: function (e) {
			if (e.which === ENTER_KEY) {
				this.closeEdit();
			} else if (e.which === ESCAPE_KEY) {
				this.title(this.lastValue);
				this.editing(false);
			}
		},

		update: {
			url: 'pidor/update'
		},
		create: {
			url: 'pidor/create'
		}

	});

	var Todos = App.Collection(Todo, {

		options: {
			// idAttr: 'groceryId',

			read: {
				url: 'tatypidor'
			}
		},

		remaining: blocks.observable(),

		init: function () {

			// console.log(localStorage.getItem('todos-jsblocks'));

			this
				.read()
				// load the data from the Local Storage
				// .reset(JSON.parse(localStorage.getItem('todos-jsblocks')) || [])
				// save to Local Storage on each item add or remove
				.on('add remove edit', this.save)
				.updateRemaining();
		},

		// set all todos as completed
		toggleAll: function () {
			var complete = this.remaining() === 0 ? false : true;
			this.each(function (todo) {
				todo.completed(complete);
			});
		},



		// remove all completed todos
		clearCompleted: function () {
			this.removeAll(function (todo) {
				return todo.completed();
			});
		},

		// saves all data back to the Local Storage
		save: function () {
			var result = [];
			// console.log(this())
			blocks.each(this(), function (model) {
				// console.log(model);	
				result.push(model.dataItem());
			});
			
			// console.log( result );
			// localStorage.setItem('todos-jsblocks', JSON.stringify(result));

			this.updateRemaining();
		},



		// updates the observable
		updateRemaining: function () {
			this.remaining(this.reduce(function (memo, todo) {
				return todo.completed() ? memo : memo + 1;
			}, 0));
		},

		// implements drag-n-drop for sortable script
		drag: function () {

		}
	});

	App.View('Todos', {
		options: {
			// creates a route for the View in order to handle
			// /all, /active, /completed filters
			route: blocks.route('{{filter}}').optional('filter')
		},

		filter: blocks.observable(),

		newTodo: new Todo(),

		// holds all todos for the current view
		// todos are filtered if "Active" or "Completed" is clicked
		todos: new Todos().extend('filter', function (value) {
			var mode = this.filter();
			var completed = value.completed();
			var include = true;

			if (mode === 'active') {
				include = !completed;
			} else if (mode === 'completed') {
				include = completed;
			}

			console.log(mode);

			return include;
		}),

		// filter the data when the route have changed
		// the callback is fired when "All", "Active" or "Completed" have been clicked
		routed: function (params) {
			if (params.filter !== 'active' && params.filter !== 'completed') {
				params.filter = 'all';
			}
			this.filter(params.filter);
		},

		addTodo: function (e) {
			if (e.which === ENTER_KEY && this.newTodo.title()) {
				this.todos.push(this.newTodo);
				// return all Todo values to their defaults
				this.newTodo.reset();
			}
		}


	});
})();
