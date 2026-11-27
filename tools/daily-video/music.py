#!/usr/bin/env python3
"""موسيقى فريدة لكل فيديو: python3 music.py <id> <category> <out.wav> [dur=31.6]
المعلمات (مفتاح، نمط، سرعة، آلة، سلّم) تُشتق من رقم القطعة وتُسجَّل في music-log.json؛ يُرفض أي تطابق مع مقطوعة سابقة."""
import sys, json, hashlib, os, wave
import numpy as np
LOG = os.environ.get('MUSIC_LOG') or os.path.join(os.path.dirname(os.path.abspath(__file__)), 'music-log.json')   # في GitHub Actions يشير إلى rax3d-posts/daily/music-log.json ليبقى السجل بين التشغيلات
MODES = {'major': [0,2,4,5,7,9,11], 'minor': [0,2,3,5,7,8,10], 'dorian': [0,2,3,5,7,9,10], 'lydian': [0,2,4,6,7,9,11], 'mixolydian': [0,2,4,5,7,9,10], 'pent': [0,2,4,7,9], 'phrygian': [0,1,3,5,7,8,10]}
MOOD = {  # الفئة ← (أسلوب مناسب)
 'الإضاءات': dict(modes=['lydian','major','pent'], bpm=(68,84), inst=['bell','pad']),
 'الديكور': dict(modes=['major','dorian','pent'], bpm=(72,92), inst=['piano','bell']),
 'إكسسوارات المكتب': dict(modes=['dorian','mixolydian','major'], bpm=(86,104), inst=['pluck','piano']),
 'إكسسوارات القهوة': dict(modes=['minor','dorian'], bpm=(70,88), inst=['piano','pluck']),
 'سناك وضيافة': dict(modes=['major','mixolydian'], bpm=(92,112), inst=['pluck','bell']),
 'ميداليات': dict(modes=['major','pent','lydian'], bpm=(96,116), inst=['bell','pluck']),
 'إكسسوارات السيارة': dict(modes=['minor','phrygian','dorian'], bpm=(100,122), inst=['synth','pluck']),
 'ألعاب وقيمرز': dict(modes=['phrygian','minor','dorian'], bpm=(104,126), inst=['synth','pluck']),
 'التوزيعات': dict(modes=['major','mixolydian'], bpm=(98,118), inst=['pluck','bell']),
}
PATTERNS = ['arp-up','arp-down','arp-pingpong','chord-pluck','bass-melody','sparkle']
def load(): return json.load(open(LOG)) if os.path.exists(LOG) else []
def params(pid, cat, taken):
    mood = MOOD.get(cat, MOOD['الديكور'])
    for salt in range(500):
        h = int(hashlib.sha256(f'{pid}|{salt}'.encode()).hexdigest(), 16)
        p = dict(root=h % 12, mode=mood['modes'][(h >> 4) % len(mood['modes'])], bpm=mood['bpm'][0] + (h >> 8) % (mood['bpm'][1] - mood['bpm'][0] + 1),
                 inst=mood['inst'][(h >> 16) % len(mood['inst'])], pattern=PATTERNS[(h >> 20) % len(PATTERNS)], prog=(h >> 24) % 6, seed=h % 100000)
        key = (p['root'], p['mode'], p['bpm'], p['inst'], p['pattern'], p['prog'])
        if all(key != (t['root'], t['mode'], t['bpm'], t['inst'], t['pattern'], t['prog']) for t in taken): return p
    raise SystemExit('لم يُعثر على معلمات فريدة')
def hz(n): return 440 * 2 ** ((n - 69) / 12)
def synth(inst, f, length, vel, sr, rng):
    n = int(sr * length); t = np.arange(n) / sr; s = np.zeros(n)
    if inst == 'piano':
        for h in range(1, 8): s += vel / h**1.15 * np.sin(2*np.pi*f*h*(1+0.0004*h*h)*t) * np.exp(-t*(1.2+0.9*h)*0.5)
        s *= np.exp(-t*0.35); s += 0.02*vel*rng.standard_normal(n)*np.exp(-t*60)
    elif inst == 'bell':
        for r, a in [(1,1),(2.76,.5),(5.4,.28),(8.93,.15)]: s += vel*a*np.sin(2*np.pi*f*r*t)*np.exp(-t*(1.6+r*0.5))
    elif inst == 'pluck':
        for h in range(1, 10): s += vel/h * np.sin(2*np.pi*f*h*t) * np.exp(-t*(3+2.2*h))
    elif inst == 'synth':
        s = vel*0.5*(np.sign(np.sin(2*np.pi*f*t)) * 0.4 + np.sin(2*np.pi*f*t) + 0.3*np.sin(2*np.pi*f*2.005*t)) * np.exp(-t*2.2)
    else:  # pad
        for d in (-0.003, 0, 0.003): s += vel*0.5*np.sin(2*np.pi*f*(1+d)*t)
        s *= np.minimum(1, t/0.4) * np.exp(-t*0.5)
    s *= np.minimum(1, t/0.004); return s
def make(pid, cat, out, dur=31.6):
    log = load(); p = params(pid, cat, log); sr = 44100; N = int(sr*dur); rng = np.random.default_rng(p['seed'])
    scale = MODES[p['mode']]; beat = 60/p['bpm']; e8 = beat/2
    PROGS = [[0,5,3,4],[0,3,4,0],[0,4,5,3],[5,3,0,4],[0,2,5,4],[3,4,0,0]]; prog = PROGS[p['prog']]
    root = 48 + p['root']  # C3 + root
    def deg(d, oct=0):
        d += oct*len(scale); return root + scale[d % len(scale)] + 12*(d // len(scale))
    L = np.zeros(N)
    def put(m, t0, ln, vel):
        s = synth(p['inst'], hz(m), ln, vel, sr, rng); i = int(t0*sr); e = min(N, i+len(s))
        if i < N: L[i:e] += s[:e-i]
    bar = beat*4; nb = int(dur/bar)+1
    for b in range(nb):
        c = prog[b % len(prog)]; tri = [deg(c), deg(c+2), deg(c+4)]
        put(deg(c, -1), b*bar, bar*1.05, .45)
        steps = 8
        for k in range(steps):
            t0 = b*bar + k*e8
            if t0 >= dur: break
            if p['pattern'] == 'arp-up': m = tri[k % 3] + 12*(k//3 % 2)
            elif p['pattern'] == 'arp-down': m = tri[2 - k % 3] + 12*((k+1)//3 % 2)
            elif p['pattern'] == 'arp-pingpong': m = tri[[0,1,2,1][k % 4]] + 12
            elif p['pattern'] == 'chord-pluck':
                if k % 4 == 0:
                    for q in tri: put(q+12, t0, 1.2, .22)
                continue
            elif p['pattern'] == 'bass-melody':
                m = deg(c+[0,2,4,2,5,4,2,0][k]) + 12
            else: m = tri[(k*2) % 3] + 12 + (12 if k % 5 == 4 else 0)
            put(m, t0, 1.0, .26)
        if p['pattern'] in ('arp-up','arp-down','sparkle') and b % 2 == 1: put(deg(c+4, 1), b*bar + e8*6, 1.6, .2)
    # reverb + fades
    ir = rng.standard_normal(int(sr*1.6))*np.exp(-np.arange(int(sr*1.6))/sr*2.8)
    from numpy.fft import rfft, irfft
    n = N+len(ir); wet = irfft(rfft(L, n)*rfft(ir, n), n)[:N]; wet /= np.max(np.abs(wet))+1e-9; L /= np.max(np.abs(L))+1e-9
    mix = 0.78*L + 0.26*wet; d = int(sr*0.012); st = np.stack([mix, np.roll(mix, d)], 1)
    st *= (np.minimum(1, np.arange(N)/(0.5*sr)) * np.minimum(1, (N-np.arange(N))/(2.0*sr)))[:, None]
    st = st/np.max(np.abs(st))*0.8
    w = wave.open(out, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes((st*32767).astype('<i2').tobytes()); w.close()
    p.update(id=pid, cat=cat); log = [t for t in log if t.get('id') != pid] + [p]; json.dump(log, open(LOG, 'w'), ensure_ascii=False, indent=1)
    print(json.dumps(p, ensure_ascii=False))
if __name__ == '__main__': make(sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]) if len(sys.argv) > 4 else 31.6)
