import { youTubeId } from './video-guide';

describe('youTubeId', () => {
  it('reads Shorts, watch, share and embed links', () => {
    expect(youTubeId('https://www.youtube.com/shorts/OwGx43UO_0Y')).toBe('OwGx43UO_0Y');
    expect(youTubeId('https://youtube.com/shorts/OwGx43UO_0Y?si=abc')).toBe('OwGx43UO_0Y');
    expect(youTubeId('https://www.youtube.com/watch?v=OwGx43UO_0Y&t=10')).toBe('OwGx43UO_0Y');
    expect(youTubeId('https://m.youtube.com/watch?v=OwGx43UO_0Y')).toBe('OwGx43UO_0Y');
    expect(youTubeId('https://youtu.be/OwGx43UO_0Y')).toBe('OwGx43UO_0Y');
    expect(youTubeId('https://www.youtube-nocookie.com/embed/OwGx43UO_0Y')).toBe('OwGx43UO_0Y');
  });

  it('rejects other sites and malformed ids', () => {
    expect(youTubeId('https://vimeo.com/123456')).toBeNull();
    expect(youTubeId('https://evil.example/shorts/OwGx43UO_0Y')).toBeNull();
    expect(youTubeId('https://www.youtube.com/shorts/"><script>')).toBeNull();
    expect(youTubeId('not a url')).toBeNull();
  });
});
