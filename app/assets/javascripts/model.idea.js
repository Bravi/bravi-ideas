BraviIdeas.IdeaModel = (function (dto) {
	var self = this;

	self.id = dto.id;
	self.created_date = dto.created_date;
	self.description = dto.description; 
	self.title = dto.title;
	self.positive = ko.observable(dto.positive);
	self.negative = ko.observable(dto.negative);
	self.user_name = dto.user_name;
	self.user_image = dto.user_image;
	self.comments_amount = ko.observable(dto.comments_amount);
	self.current_user_has_voted = (dto.current_user_id_voted && dto.current_user_id_voted > 0);
	self.current_user_is_the_author = (dto.user_id === BraviIdeas.app().currentUserId());
	self.path_edit = '/ideas/' + self.id + '/edit';

	var _previewDescription = '';
	self.getPreviewDescription = function(){
		var desc = self.description;
		if(_previewDescription || !desc) return _previewDescription;

		_previewDescription = ((desc.length > 130) ? desc.substr(0, 130) : desc) +  '...';
		return _previewDescription;
	};

	self.getTotal = function(){
		return self.positive() + self.negative();
	};
	
	self.has_votes = ko.observable();
	
	self.has_votes_notification = ko.computed(function(){
		return self.has_votes(self.getTotal() > 0);
	});
	
	self.percentPositive = ko.computed(function(){

		if (self.getTotal() === 0){
			return 50;
		}

		return ((self.positive() * 100 ) / self.getTotal()).toFixed(2);
	});

	self.percentNegative = ko.computed(function(){

		if (self.getTotal() === 0){
			return 50;
		}

		return ((self.negative() * 100 ) / self.getTotal()).toFixed(2);
	});

	self.vote = function(voteType){
		if(voteType ===  'like')
			self.positive(self.positive() + 1);
		else
			self.negative(self.negative() + 1);
	};
	
	function getCommentsAmount(){
		var amount = parseInt(self.comments_amount());
		if(isNaN(amount)){
			amount = 0; 
		}
		return amount;
	}
	
	self.upCommentsAmount = function(){
		self.comments_amount(getCommentsAmount() + 1);
	};
	
	self.downCommentsAmount = function(){
		self.comments_amount(getCommentsAmount() - 1);
	};

	return self;
});