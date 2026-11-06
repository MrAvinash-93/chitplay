import { describe, it, expect } from './harness.js';
import { cleanName, isValidName, pickOpponents, namesOf, NAME_REGIONS, randomName } from '../src/world/names.js?v=20261107-cast';
import { PRESETS, cleanLook, lookOf, portraitSvg, AGES } from '../src/world/character-looks.js?v=20261107-cast';
import { profile, rankFor, RANKS } from '../src/persistence/profile-store.js?v=20261107-cast';

describe('Names', () => {
  it('keeps letters and spaces only', () => {
    expect(cleanName('Ro1h@an 7')).toBe('Rohan ');
    expect(cleanName('<b>Asha</b>')).toBe('bAshab');
    expect(cleanName('李伟')).toBe('李伟');
    expect(isValidName('Mary Ann')).toBe(true);
    expect(isValidName('Avin1')).toBe(false);
    expect(isValidName('')).toBe(false);
  });
  it('every region has men’s and women’s names that are valid', () => {
    for (const r of NAME_REGIONS) {
      const n = namesOf(r);
      expect(n.m.length >= 15 && n.f.length >= 15).toBe(true);
      for (const name of [...n.m, ...n.f]) expect(isValidName(name)).toBe(true);
    }
  });
  it('India has a long list with both Avinash and Akash', () => {
    const n = namesOf('IN');
    expect(n.m.length >= 50 && n.f.length >= 50).toBe(true);
    expect(n.m.includes('Avinash') && n.m.includes('Akash') && n.m.includes('Rahul')).toBe(true);
  });
  it('opponents have different names, none like yours', () => {
    for (let i = 0; i < 200; i++) {
      const list = pickOpponents(3, ['Rahul'], 'IN');
      const names = list.map(o => o.name);
      expect(new Set(names).size).toBe(3);
      expect(names.includes('Rahul')).toBe(false);
      expect(list.every(o => o.gender === 'm' || o.gender === 'f')).toBe(true);
    }
  });
  it('a random Chinese name comes from the Chinese list', () => {
    expect(namesOf('CN').f.includes(randomName('f', 'CN'))).toBe(true);
  });
});

describe('Characters', () => {
  it('has at least 20 characters of every age', () => {
    expect(PRESETS.length >= 20).toBe(true);
    for (const a of AGES) expect(PRESETS.some(p => p.age === a.id)).toBe(true);
  });
  it('a broken or hostile look from another phone becomes a safe one', () => {
    const l = cleanLook({ hair: 'x"><script>', skin: 'red;', outfit: 42, age: 'adult', color: '#123456' }, 'teacher');
    expect(l.hair).toBe(lookOf('teacher').hair);
    expect(l.skin).toBe(lookOf('teacher').skin);
    expect(l.outfit).toBe(lookOf('teacher').outfit);
    expect(l.age).toBe('adult');
    expect(l.color).toBe('#123456');
    expect(portraitSvg({ hairColor: '"><img src=x onerror=alert(1)>' }).includes('onerror')).toBe(false);
  });
});

describe('Profile', () => {
  it('refuses a name with digits and keeps a clean one', () => {
    const before = profile.name;
    profile.setName('Test Name');
    expect(profile.name).toBe('Test Name');
    profile.setName('123');
    expect(profile.name).toBe('Test Name');
    profile.setName(before);
  });
  it('pins and unpins a game', () => {
    profile.unpin('JP');
    expect(profile.togglePin('JP')).toBe(true);
    expect(profile.pins[0]).toBe('JP');
    expect(profile.togglePin('JP')).toBe(false);
  });
  it('ranks climb with points and stop at the top', () => {
    expect(rankFor(0).index).toBe(0);
    expect(rankFor(RANKS[1].at).index).toBe(1);
    expect(rankFor(10000000).next).toBe(null);
    expect(rankFor(10000000).progress).toBe(1);
  });
  it('solo and Nearby points are kept apart, a bad match costs nothing, reset clears all', () => {
    profile.resetScore();
    profile.recordMatch({ mode: 'local', won: true, score: 2000, game: 'IN', rounds: 7 });
    const r = profile.recordMatch({ mode: 'nearby', won: false, score: -300, game: 'IN', rounds: 7 });
    expect(r.gained).toBe(0);
    expect(profile.stats.local.points).toBe(2000);
    expect(profile.stats.nearby.points).toBe(0);
    expect(profile.stats.nearby.matches).toBe(1);
    expect(profile.badges.includes('first-win')).toBe(true);
    expect(profile.hall.length).toBe(2);
    profile.resetScore();
    expect(profile.all.points).toBe(0);
    expect(profile.badges).toHaveLength(0);
    expect(profile.hall).toHaveLength(0);
  });
});
