import { ToMetricUnitsPipe } from './to-metric-units.pipe';

describe('ToMetricUnitsPipe', () => {
  it('create an instance', () => {
    const pipe = new ToMetricUnitsPipe();
    expect(pipe).toBeTruthy();
  });
});
