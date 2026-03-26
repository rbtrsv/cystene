from django_neomodel import DjangoNode  # type: ignore
from neomodel import (  # type: ignore
    StructuredRel,
    StringProperty,
    IntegerProperty,
    FloatProperty,
    DateProperty,
    ArrayProperty,
    RelationshipTo,
    RelationshipFrom,
)

# Relationship Definitions
class InvolvementRel(StructuredRel):
    role = StringProperty()
    investment_amount = FloatProperty()

class UtilizesRel(StructuredRel):
    license_type = StringProperty()
    investment_amount = FloatProperty()

class UsesRel(StructuredRel):
    implementation_date = DateProperty()

class IncludesRel(StructuredRel):
    market_share = FloatProperty()

class ImpactsRel(StructuredRel):
    impact_type = StringProperty()
    impact_value = FloatProperty()
    impact_date = DateProperty()

class SuppliesRel(StructuredRel):
    product_name = StringProperty()
    annual_volume = FloatProperty()
    contract_start = DateProperty()
    contract_end = DateProperty()

class OperatesInRel(StructuredRel):
    market_share = FloatProperty()
    entry_date = DateProperty()

# Node Definitions
class Company(DjangoNode):
    name = StringProperty(unique_index=True)
    type = StringProperty()  # Manufacturer, Project Developer, etc.
    founded = DateProperty()
    headquarters = StringProperty()
    website = StringProperty()
    revenue = FloatProperty()
    employees = IntegerProperty()
    status = StringProperty()  # Active, Inactive, etc.
    stock_symbol = StringProperty()
    sustainability_score = FloatProperty()
    r_and_d_budget = FloatProperty()

    # Relationships
    involved_in = RelationshipTo("Project", "INVOLVED_IN", model=InvolvementRel)
    utilizes = RelationshipTo("Technology", "UTILIZES", model=UtilizesRel)
    produces = RelationshipTo("Product", "PRODUCES")
    supplies = RelationshipTo("Company", "SUPPLIES", model=SuppliesRel)
    publishes = RelationshipTo("ResearchPaper", "PUBLISHES")
    attends = RelationshipTo("Event", "ATTENDS")
    has_position = RelationshipTo("ValueChainPosition", "HAS_POSITION")
    operates_in = RelationshipTo("Market", "OPERATES_IN", model=OperatesInRel)
    impacted_by = RelationshipFrom("Policy", "IMPACTS", model=ImpactsRel)

    def __str__(self):
        return self.name

class Project(DjangoNode):
    name = StringProperty(unique_index=True)
    type = StringProperty()  # Production, Utilization, etc.
    status = StringProperty()  # Planning, Operational, etc.
    capacity = FloatProperty()
    start_date = DateProperty()
    end_date = DateProperty()
    investment = FloatProperty()
    carbon_footprint = FloatProperty()
    energy_efficiency = FloatProperty()

    # Relationships
    uses = RelationshipTo("Technology", "USES", model=UsesRel)
    located_in = RelationshipTo("Location", "LOCATED_IN")
    involved_companies = RelationshipFrom("Company", "INVOLVED_IN", model=InvolvementRel)

    def __str__(self):
        return self.name

class Technology(DjangoNode):
    name = StringProperty(unique_index=True)
    category = StringProperty()  # Production, Storage, Utilization
    description = StringProperty()
    readiness_level = IntegerProperty()
    efficiency = FloatProperty()
    patent_numbers = ArrayProperty(StringProperty())
    last_breakthrough = DateProperty()

    # Relationships
    utilized_by_companies = RelationshipFrom("Company", "UTILIZES", model=UtilizesRel)
    used_in_projects = RelationshipFrom("Project", "USES", model=UsesRel)
    featured_in_events = RelationshipFrom("Event", "FEATURES")

    def __str__(self):
        return self.name

class Market(DjangoNode):
    name = StringProperty(unique_index=True)
    size = FloatProperty()  # Market size in USD
    growth_rate = FloatProperty()
    forecast_year = IntegerProperty()
    forecast_value = FloatProperty()
    segments = ArrayProperty(StringProperty())
    key_drivers = ArrayProperty(StringProperty())
    barriers = ArrayProperty(StringProperty())

    # Relationships
    includes_companies = RelationshipTo("Company", "INCLUDES", model=IncludesRel)

    def __str__(self):
        return self.name

class Policy(DjangoNode):
    name = StringProperty()
    country = StringProperty()
    type = StringProperty()  # Incentive, Regulation, etc.
    description = StringProperty()
    start_date = DateProperty()
    end_date = DateProperty()
    impact = StringProperty()  # Positive, Negative, Neutral
    budget_allocation = FloatProperty()
    target_sectors = ArrayProperty(StringProperty())

    # Relationships
    impacts = RelationshipTo("Company", "IMPACTS", model=ImpactsRel)
    targets = RelationshipTo("Sector", "TARGETS")

    def __str__(self):
        return f"{self.name} ({self.country})"

class Product(DjangoNode):
    name = StringProperty()
    type = StringProperty()  # Electrolyzer, Fuel Cell, etc.
    price = FloatProperty()
    launch_date = DateProperty()
    performance_metrics = StringProperty()  # JSON or serialized string

    # Relationships
    produced_by = RelationshipFrom("Company", "PRODUCES")

    def __str__(self):
        return self.name

class ResearchPaper(DjangoNode):
    title = StringProperty()
    authors = ArrayProperty(StringProperty())
    publication_date = DateProperty()
    journal = StringProperty()
    doi = StringProperty(unique_index=True)
    keywords = ArrayProperty(StringProperty())

    # Relationships
    published_by = RelationshipFrom("Company", "PUBLISHES")
    cited_by = RelationshipTo("ResearchPaper", "CITED_BY")

    def __str__(self):
        return self.title

class Event(DjangoNode):
    name = StringProperty()
    type = StringProperty()  # Conference, Workshop, etc.
    start_date = DateProperty()
    end_date = DateProperty()
    location = StringProperty()
    organizers = ArrayProperty(StringProperty())

    # Relationships
    attendees = RelationshipFrom("Company", "ATTENDS")
    features = RelationshipTo("Technology", "FEATURES")

    def __str__(self):
        return self.name

class ValueChainPosition(DjangoNode):
    name = StringProperty(unique_index=True)

    # Relationships
    companies = RelationshipFrom("Company", "HAS_POSITION")

    def __str__(self):
        return self.name

class Sector(DjangoNode):
    name = StringProperty(unique_index=True)

    # Relationships
    policies = RelationshipFrom("Policy", "TARGETS")

    def __str__(self):
        return self.name

class Location(DjangoNode):
    country = StringProperty()
    state = StringProperty()
    city = StringProperty()
    coordinates = ArrayProperty(FloatProperty())

    # Relationships
    projects = RelationshipFrom("Project", "LOCATED_IN")

    def __str__(self):
        return f"{self.city}, {self.state}, {self.country}"
