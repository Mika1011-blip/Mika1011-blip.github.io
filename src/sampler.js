// A tiny hand-built "language model": the letter is a sequence of fixed text and
// slots. Each slot holds candidate tokens with logits; a token is drawn from
// softmax(logits / T). Facts live in the fixed text, so temperature only changes
// the style, never what is true.

const S = (id, options) => ({ id, options });

const LETTERS = {
  en: [
    S('greet', [['Hello,', 3], ['Hi,', 2.4], ['Dear reader,', 2], ['Greetings, fellow particle,', 0.3], ['Ahoy,', -0.6]]),
    ' I’m Minh Khang, and I have always been ',
    S('feel', [['fascinated', 3], ['curious', 2.6], ['obsessed', 1.2], ['slightly haunted', -0.2], ['emotionally entangled', -0.8]]),
    ' by ',
    S('topic', [['mathematics and physics', 3], ['the maths behind physics', 2.5], ['equations that describe the world', 1.8], ['anything with a Greek letter in it', 0.2], ['the secret life of vectors', -0.7]]),
    '. What I love most is how ',
    S('rule', [['simple rules', 3], ['a few equations', 2.2], ['tiny interactions', 1.6], ['three lines of code', 0.4], ['one bored electron', -1]]),
    ' can give rise to ',
    S('emerge', [['complex behaviour', 3], ['whole systems', 2.4], ['patterns nobody planned', 1.8], ['galaxies and stock markets', 0.5], ['absolute chaos, beautifully', -0.5]]),
    '.\n',
    'That curiosity led me to ',
    S('field', [['AI engineering', 3], ['machine learning', 2.6], ['building models', 1.8], ['teaching sand to think', 0.2], ['arguing with gradients', -0.5]]),
    ', which I study at EFREI in Big Data & Machine Learning. I learn best by ',
    S('learn', [['building things', 3], ['shipping projects', 2.4], ['breaking things, then fixing them', 1.6], ['staring at loss curves', 0.3], ['bribing the compiler', -0.9]]),
    ': a platform for annotating tumours in MRI scans, a rent estimator, a budgeting app and a retina classifier.\n',
    'If you are looking for someone who ',
    S('who', [['asks why', 3], ['likes hard problems', 2.6], ['reads the paper and the code', 1.8], ['enjoys a good proof', 0.6], ['dreams in tensors', -0.4]]),
    ', I would be ',
    S('close', [['glad to talk', 3], ['happy to hear from you', 2.6], ['delighted to help', 1.6], ['over the moon', 0.2], ['gravitationally attracted', -0.4]]),
    '.',
  ],
  fr: [
    S('greet', [['Bonjour,', 3], ['Salut,', 2.2], ['Cher lecteur,', 2], ['Salutations, chère particule,', 0.3], ['Ohé,', -0.6]]),
    ' je suis Minh Khang, et j’ai toujours été ',
    S('feel', [['fasciné', 3], ['curieux', 2.6], ['obsédé', 1.2], ['un peu hanté', -0.2], ['émotionnellement intriqué', -0.8]]),
    ' par ',
    S('topic', [['les mathématiques et la physique', 3], ['les maths derrière la physique', 2.5], ['les équations qui décrivent le monde', 1.8], ['tout ce qui contient une lettre grecque', 0.2], ['la vie secrète des vecteurs', -0.7]]),
    '. Ce que j’aime le plus, c’est voir comment ',
    S('rule', [['des règles simples', 3], ['quelques équations', 2.2], ['de petites interactions', 1.6], ['trois lignes de code', 0.4], ['un électron qui s’ennuie', -1]]),
    ' peuvent produire ',
    S('emerge', [['des comportements complexes', 3], ['des systèmes entiers', 2.4], ['des motifs que personne n’a prévus', 1.8], ['des galaxies et des marchés', 0.5], ['un chaos absolu, magnifiquement', -0.5]]),
    '.\n',
    'Cette curiosité m’a mené à ',
    S('field', [['l’ingénierie de l’IA', 3], ['l’apprentissage automatique', 2.6], ['la construction de modèles', 1.8], ['apprendre au sable à penser', 0.2], ['me disputer avec des gradients', -0.5]]),
    ', que j’étudie à l’EFREI en Big Data & Machine Learning. J’apprends surtout en ',
    S('learn', [['construisant', 3], ['livrant des projets', 2.4], ['cassant puis réparant', 1.6], ['fixant des courbes de perte', 0.3], ['soudoyant le compilateur', -0.9]]),
    ' : une plateforme d’annotation de tumeurs sur IRM, un estimateur de loyer, une application de budget et un classifieur de rétine.\n',
    'Si vous cherchez quelqu’un qui ',
    S('who', [['demande pourquoi', 3], ['aime les problèmes difficiles', 2.6], ['lit le papier et le code', 1.8], ['apprécie une belle preuve', 0.6], ['rêve en tenseurs', -0.4]]),
    ', je serais ',
    S('close', [['ravi d’échanger', 3], ['heureux d’avoir de vos nouvelles', 2.6], ['enchanté d’aider', 1.6], ['aux anges', 0.2], ['gravitationnellement attiré', -0.4]]),
    '.',
  ],
};

export function softmax(options, T) {
  const t = Math.max(T, 0.05);
  const z = options.map(([, l]) => l / t);
  const m = Math.max(...z);
  const e = z.map((v) => Math.exp(v - m));
  const sum = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / sum);
}

function draw(probs) {
  let r = Math.random();
  for (let i = 0; i < probs.length; i++) { r -= probs[i]; if (r <= 0) return i; }
  return probs.length - 1;
}

// mount(root, lang, ui) wires the controls inside root and returns a cleanup function.
// Writes token by token even with reduced motion: text appearing in place is
// not movement, and the pace is what shows the sampling.
export function mountSampler(root, lang) {
  const out = root.querySelector('[data-letter]');
  const slider = root.querySelector('[data-temp]');
  const tOut = root.querySelector('[data-temp-value]');
  const btn = root.querySelector('[data-resample]');
  const dist = root.querySelector('[data-dist]');
  const items = LETTERS[lang];
  let timer = null;
  let lastSlot = items.find((x) => typeof x !== 'string');
  let lastPick = 0;

  const T = () => Number(slider.value);

  function renderDist() {
    const probs = softmax(lastSlot.options, T());
    dist.innerHTML = lastSlot.options.map(([tok], i) => {
      const p = probs[i];
      return `<li class="${i === lastPick ? 'is-picked' : ''}"><span class="dist-tok">${tok}</span>`
        + `<span class="dist-bar"><span style="transform:scaleX(${p.toFixed(3)})"></span></span>`
        + `<span class="dist-p">${Math.round(p * 100)}%</span></li>`;
    }).join('');
  }

  function generate() {
    clearTimeout(timer);
    out.innerHTML = '<p></p>';
    let para = out.firstChild;
    let i = 0;
    const step = () => {
      if (i >= items.length) { out.classList.remove('is-writing'); return; }
      const item = items[i++];
      let text;
      if (typeof item === 'string') {
        const parts = item.split('\n');
        parts.forEach((part, k) => {
          if (k > 0) { para = document.createElement('p'); out.appendChild(para); }
          if (part) para.append(part);
        });
        return (timer = setTimeout(step, 30));
      }
      const probs = softmax(item.options, T());
      const pick = draw(probs);
      lastSlot = item; lastPick = pick;
      text = item.options[pick][0];
      const span = document.createElement('span');
      span.className = 'tok' + (pick >= 3 ? ' is-rare' : '');
      span.textContent = text;
      para.append(span);
      renderDist();
      timer = setTimeout(step, 140);
    };
    out.classList.add('is-writing');
    step();
  }

  const onInput = () => { tOut.textContent = T().toFixed(2); renderDist(); };
  slider.addEventListener('input', onInput);
  slider.addEventListener('change', generate);
  btn.addEventListener('click', generate);
  onInput();
  generate();
  return () => clearTimeout(timer);
}
