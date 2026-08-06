// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { useNavigationStore } from './navigation-store';

const SPEC_A = 'https://a.example/openapi.json';
const SPEC_B = 'https://b.example/openapi.json';

describe('useNavigationStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useNavigationStore.setState({ favorites: {}, recent: {} });
  });

  it('defaults to empty favorites/recent for an unseen spec', () => {
    expect(useNavigationStore.getState().favorites[SPEC_A]).toBeUndefined();
    expect(useNavigationStore.getState().isFavorite(SPEC_A, 'users/findAllUsers')).toBe(false);
  });

  it('toggleFavorite adds then removes, persisting to localStorage', () => {
    useNavigationStore.getState().toggleFavorite(SPEC_A, 'users/findAllUsers');
    expect(useNavigationStore.getState().isFavorite(SPEC_A, 'users/findAllUsers')).toBe(true);
    expect(JSON.parse(localStorage.getItem('docfy-ui:navigation')!).favorites[SPEC_A]).toEqual(['users/findAllUsers']);

    useNavigationStore.getState().toggleFavorite(SPEC_A, 'users/findAllUsers');
    expect(useNavigationStore.getState().isFavorite(SPEC_A, 'users/findAllUsers')).toBe(false);
  });

  it('scopes favorites per spec URL', () => {
    useNavigationStore.getState().toggleFavorite(SPEC_A, 'users/findAllUsers');
    expect(useNavigationStore.getState().isFavorite(SPEC_B, 'users/findAllUsers')).toBe(false);
  });

  it('recordVisit moves the endpoint to the front, deduping', () => {
    useNavigationStore.getState().recordVisit(SPEC_A, 'users/findAllUsers');
    useNavigationStore.getState().recordVisit(SPEC_A, 'orders/createOrder');
    useNavigationStore.getState().recordVisit(SPEC_A, 'users/findAllUsers');
    expect(useNavigationStore.getState().recent[SPEC_A]).toEqual(['users/findAllUsers', 'orders/createOrder']);
  });

  it('recordVisit caps recent at 5 entries', () => {
    for (let i = 0; i < 7; i++) {
      useNavigationStore.getState().recordVisit(SPEC_A, `op-${i}`);
    }
    expect(useNavigationStore.getState().recent[SPEC_A]).toEqual(['op-6', 'op-5', 'op-4', 'op-3', 'op-2']);
  });

  it('clearRecent empties the recent list for that spec without touching favorites', () => {
    useNavigationStore.getState().recordVisit(SPEC_A, 'users/findAllUsers');
    useNavigationStore.getState().toggleFavorite(SPEC_A, 'users/findAllUsers');

    useNavigationStore.getState().clearRecent(SPEC_A);

    expect(useNavigationStore.getState().recent[SPEC_A]).toEqual([]);
    expect(useNavigationStore.getState().isFavorite(SPEC_A, 'users/findAllUsers')).toBe(true);
  });

  it('clearRecent only affects the given spec', () => {
    useNavigationStore.getState().recordVisit(SPEC_A, 'users/findAllUsers');
    useNavigationStore.getState().recordVisit(SPEC_B, 'users/findAllUsers');

    useNavigationStore.getState().clearRecent(SPEC_A);

    expect(useNavigationStore.getState().recent[SPEC_A]).toEqual([]);
    expect(useNavigationStore.getState().recent[SPEC_B]).toEqual(['users/findAllUsers']);
  });
});
