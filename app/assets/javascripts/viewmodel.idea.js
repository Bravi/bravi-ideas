BraviIdeas.ViewModelIdea = (function(){
	var ideas = ko.observableArray([]),
	comments = ko.observableArray([]),
	comment = ko.observable(),
	selected = ko.observable(),
	amountIdeas = ko.observable(),

	ideasLoadCompleted = ko.observable(),

	ideasLoading = ko.observable(true),

	canVote = ko.computed(function(){
		return BraviIdeas.app().isUserAuthenticated() && selected() && !selected().current_user_has_voted;
	}),

	canNotVoteComment = ko.computed(function(){
		return !BraviIdeas.app().isUserAuthenticated() || !selected();
	}),

	canComment = ko.computed(function(){
		return BraviIdeas.app().isUserAuthenticated() && selected();
	}),

	like = function () {
		vote('like', voteCallback, this);
	},

	unlike = function () {
		vote('unlike', voteCallback, this);
	},

	getIdeaId = function (elment) {
		return selected() && selected().id;
	},

	voteCallback = function (voteType, idea) {
		idea.vote(voteType);
		disableVoteButtons();
	},

	disableVoteButtons = function () {
		$('.idea-like, .idea-unlike', '#full-idea')
		.addClass('disabled')
		.prop('disabled', true)
		.off('click');
	},

	getAll = function(sort){
		ideasLoading(true);
		hideIdeaOpen();

		var sortType = sort ? ('?sort_type=' + sort) : '';
		$.ajax({
			type    : 'GET',
			url     : '/home/ideas.json' + sortType
		}).done(function(data){
			mapToModel(data, BraviIdeas.IdeaModel);
			ideas(data);
			amountIdeas(ideas().length);

			// notify the page is ready
			ideasLoadCompleted(true); // used just the first time
			ideasLoading(false);
		});

		function hideIdeaOpen(){
			$('#wrapper-full-idea').slideUp();
		}
	},

	getComments = function(idea, callback){
		$.ajax({
			type    : 'GET',
			url     : '/home/comments/' + idea + '.json'
		}).done(function(data){
			mapToModel(data, BraviIdeas.CommentModel);
			comments(data);
			callback();
		});
	},

	mapToModel = function (items, modelType){
		for(var i = 0; i < items.length; i++){
			// override dto for a proper model
			items[i] = new modelType(items[i]);
		};
	},

	vote = function (type, callback, idea) {
		$.ajax({
			type    : 'PUT',
			url     : '/ideas/' + idea.id + '/' + type + '.json'
		}).done(function(){
			callback(type, idea);

			selected().current_user_has_voted = BraviIdeas.app().currentUserId();
		}).fail(function(){
			toastr.warning('<strong>Really, again?!</strong><br>You alredy voted on it.');
		});
	},

	saveNewComment = function (description, idea) {
		return $.ajax({
			type    : 'POST',
			data 	: { 'description': description, 'idea_id':  idea },
			url     : '/home/add_comment.json',
			dataType : 'json'
		});
	},

	addComment = function(){
		if(!comment()){
			toastr.warning('<strong>Really?!</strong><br>Commenting without a text?! Don\'t do that.');
			return;
		}

		$.when(saveNewComment(comment(), selected().id))
		.done(function(data){
			var model = new BraviIdeas.CommentModel(data);
			comments.push(model);
			comment('');
			selected().upCommentsAmount(); 
			toastr.success('Successfully saved.');

			// notify broadcast
			BraviIdeas.notification.notify_new_comment(selected().id, model.id);
		})
		.fail(function(){
			toastr.warning('Comment not saved.');
		});
	},

	deleteComment = function (comment) {
		return $.ajax({
			type    : 'DELETE',
			url     : '/home/remove_comment/' + comment.id + '.json'
		});
	},

	removeComment = function(){
		var commentToDelete = this;
		$.when(deleteComment(commentToDelete)).done(completed);

		function completed(){
			for (var i = 0; i < comments().length; i++) {
				if(comments()[i].id === commentToDelete.id){
					comments.splice(i, 1);
					selected().downCommentsAmount(); 

					// notify broadcast
					BraviIdeas.notification.notify_remove_comment(selected().id, commentToDelete.id);
					break;
				}        
			};

			toastr.success('Successfully removed.');
		}
	},

	selectIdea = function(item){
		var newItem = !selected() || (item.id !== selected().id);

		selected(item);

		var box = $('#wrapper-full-idea');

		if(box.is(':visible') && !newItem){
			box.slideUp();
		}
		else{
			box.hide();
			getComments(selected().id, completed);

			function completed(){
				positionFullIdeaBox();
				box.slideDown();

				$(window).on('resize', positionFullIdeaBox);

				function positionFullIdeaBox(){
					var boxPreview = $('.idea[data-idea="' + selected().id + '"]');
					var box = $('#wrapper-full-idea');
					var position = boxPreview.position();

					$('#arrow').css('margin-left', (position.left + 20) + 'px');

					box.css('top', (boxPreview.height() + position.top + 10) + 'px');
				}
			};
		}
	},

	sort = ko.observable(),

	changedSort = ko.computed(function(){
		var sortType = sort();
		getAll(sortType);
	}),

	ideasGroupRows = ko.computed(function () {

		var items =  ideas(),
		result = [];
		for (var i = 0; i < items.length; i += 3) {
			var row = [];
			for (var j = 0; j < 3; ++j) {
				if (items[i + j]) {
					row.push(items[i + j]);
				}
			}
			result.push(row);
		}
		return result;
	}),

	bindDOMEvents = function(){
		function bindSlideUpDownBox(selector, getBoxFunc){
			$(document).on('click', selector, function(e) {
				var box = getBoxFunc(this);

				box.is(':visible') ? box.slideUp() : box.slideDown();

				e.preventDefault();
			});
		}

		bindSlideUpDownBox('.percentage-votes-bar', function(that){
			return $(that).prev('.idea-content').find('.percentage-votes-values');
		});

		bindSlideUpDownBox('#close-idea', function(that){
			return $('#wrapper-full-idea');
		});

		bindSlideUpDownBox('.btn-comments', function(){
			return $('.group-comments');
		});

		bindSlideUpDownBox('#btn-filter', function(){
			return $('#filter-options-bar');
		});
	};

	
	init = function(){
		getAll();

		bindDOMEvents();
	};

	var vm = {
		amountIdeas: amountIdeas,
		ideasLoading: ideasLoading,
		ideasLoadCompleted: ideasLoadCompleted,
		canVote: canVote,
		canNotVoteComment: canNotVoteComment,
		canComment: canComment,
		ideas: ideas,
		comments: comments,
		comment: comment,
		like: like,
		unlike: unlike,
		getIdeaId: getIdeaId,
		voteCallback: voteCallback,
		disableVoteButtons: disableVoteButtons,
		ideasGroupRows: ideasGroupRows,
		addComment: addComment,
		removeComment: removeComment,
		selected: selected,
		selectIdea: selectIdea,
		sort: sort
	};

	init();

	return vm;
});

// Bind to view
var mainViewModel = new BraviIdeas.ViewModelIdea();
ko.applyBindings(mainViewModel);

BraviIdeas.notification = new IdeaNotification(mainViewModel);
