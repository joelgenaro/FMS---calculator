import { ParseIntPipe } from './parse-int.pipe';

describe('ParseIntPipe', () => {
  it('create an instance', () => {
    const pipe = new ParseIntPipe();
    expect(pipe).toBeTruthy();
  });
});
