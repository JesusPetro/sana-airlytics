from src.shared.domain.aggregate_root import AggregateRoot
from src.shared.domain.domain_event import DomainEvent


class SomethingHappened(DomainEvent):
    pass


class FakeAggregate(AggregateRoot):
    def do_something(self) -> None:
        self._record_event(SomethingHappened())


class TestAggregateRootEvents:
    def test_starts_with_no_events(self):
        agg = FakeAggregate()
        assert agg.pull_events() == []

    def test_record_event_adds_event(self):
        agg = FakeAggregate()
        agg.do_something()
        events = agg.pull_events()
        assert len(events) == 1
        assert isinstance(events[0], SomethingHappened)

    def test_pull_events_clears_list(self):
        agg = FakeAggregate()
        agg.do_something()
        agg.pull_events()
        assert agg.pull_events() == []

    def test_multiple_events_preserved_in_order(self):
        agg = FakeAggregate()
        agg.do_something()
        agg.do_something()
        agg.do_something()
        events = agg.pull_events()
        assert len(events) == 3
