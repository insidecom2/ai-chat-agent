import { describe, it, expect, beforeEach } from 'vitest';
import { useHostStore } from '@/store/hostStore';

describe('useHostStore', () => {
  beforeEach(() => {
    useHostStore.setState({ host: 'http://localhost:11434' });
    localStorage.clear();
  });
  it('starts with default host', () => {
    const state = useHostStore.getState();
    expect(state.host).toBe('http://localhost:11434');
  });

  it('setHost updates the host', () => {
    const { setHost } = useHostStore.getState();
    setHost('http://192.168.1.100:11434');
    expect(useHostStore.getState().host).toBe('http://192.168.1.100:11434');
  });

  it('persists to localStorage', () => {
    const { setHost } = useHostStore.getState();
    setHost('http://example.com:11434');
    const stored = localStorage.getItem('ollama-host-storage');
    expect(stored).not.toBeNull();
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.state.host).toBe('http://example.com:11434');
    }
  });
});
