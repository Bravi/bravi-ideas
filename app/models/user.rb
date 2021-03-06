class User < ActiveRecord::Base
  has_many :comments
  has_many :ideas

  attr_accessible :email, :name, :provider, :uid, :oauth_token, :oauth_expires_at, :image

	def self.from_omniauth(auth)
	  where(auth.slice(:provider, :uid)).first_or_initialize.tap do |user|
	  	puts auth
	    user.provider = auth[:provider]
	    user.uid = auth[:uid]
	    user.name = auth[:info][:name]
	    user.email = auth[:info][:email] || auth[:extra][:raw_info][:email]
	    user.oauth_token = auth[:credentials][:token]
	    user.oauth_expires_at = Time.at(auth[:credentials][:expires_at])
	    user.image = auth[:info][:image]
	    user.save!
	  end
	end
end