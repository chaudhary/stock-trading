class GooglePlace
  include Mongoid::Document

  self.collection_name = "google_places"

  identity :type => String

  field :name, :type => String
  field :address, :type => String
  field :position, :type => Array, geo: true

  field :raw_data, :type => Hash

  def self.build(params)
    google_area = ::GooglePlace.find_or_initialize_by(:_id => params[:id])
    google_area.name = params[:name]
    google_area.address = params[:address]
    google_area.position = [params[:raw_data][:geometry][:location][:lat], params[:raw_data][:geometry][:location][:lng]]
    google_area.raw_data = params[:raw_data]
    google_area.save!
  end

  def raw_data
    Hashie::Mash.new(super)
  end

end