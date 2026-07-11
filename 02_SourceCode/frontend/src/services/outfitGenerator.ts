// Outfit Generator - rule-based recommendation engine (deterministic-but-randomized, no AI).

import type { WardrobeItem, GeneratedOutfit, OutfitRequest } from '@/types';
import type { CategoryId } from '@constants/index';

// Returns occasions eligible for the selected occasion (strict match — no silent substitution).
function compatibleOccasions(occasion: string): string[] {
  return [occasion];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

// Weather-based filtering hints (optional nudges; never remove required categories).
function weatherSuitability(
  item: WardrobeItem,
  weather: string | null,
): number {
  if (!weather) return 1;
  const w = weather.toLowerCase();
  const type = item.type.toLowerCase();
  const cat = item.category;

  // Hot weather: prefer shorts, skirts, sandals, tank tops; avoid boots/heavy.
  if (w === 'hot') {
    if (
      ['shorts', 'skirt', 'sandals', 'tank top'].some((t) => type.includes(t))
    )
      return 2;
    if (['boots', 'sweater', 'hoodie'].some((t) => type.includes(t)))
      return 0.3;
  }
  // Cold weather: prefer boots, sweaters, long items.
  if (w === 'cold') {
    if (
      ['boots', 'sweater', 'hoodie', 'jeans', 'trousers'].some((t) =>
        type.includes(t),
      )
    )
      return 2;
    if (['sandals', 'shorts', 'tank top'].some((t) => type.includes(t)))
      return 0.3;
  }
  // Rainy: prefer boots, avoid suede/sandals.
  if (w === 'rainy') {
    if (cat === 'shoes' && type.includes('boot')) return 2;
    if (cat === 'shoes' && type.includes('sandal')) return 0.2;
  }
  return 1;
}

// Style preference nudges — boosts items whose type aligns with a style.
function styleSuitability(item: WardrobeItem, styles: string[]): number {
  if (styles.length === 0) return 1;
  const type = item.type.toLowerCase();
  let score = 1;
  for (const s of styles) {
    switch (s.toLowerCase()) {
      case 'minimalist':
        if (
          ['t-shirt', 'shirt', 'jeans', 'sneakers', 'loafers'].some((t) =>
            type.includes(t),
          )
        )
          score *= 1.4;
        break;
      case 'bold':
        if (['gown', 'cocktail dress', 'heels'].some((t) => type.includes(t)))
          score *= 1.3;
        break;
      case 'classic':
        if (
          ['shirt', 'blouse', 'trousers', 'loafers', 'flats'].some((t) =>
            type.includes(t),
          )
        )
          score *= 1.4;
        break;
      case 'trendy':
        if (['hoodie', 'joggers', 'sneakers'].some((t) => type.includes(t)))
          score *= 1.3;
        break;
      case 'cozy':
        if (
          ['sweater', 'hoodie', 'joggers', 'boots'].some((t) =>
            type.includes(t),
          )
        )
          score *= 1.5;
        break;
      case 'sporty':
        if (
          ['tank top', 'leggings', 'joggers', 'sneakers'].some((t) =>
            type.includes(t),
          )
        )
          score *= 1.5;
        break;
      case 'elegant':
        if (
          ['blouse', 'cocktail dress', 'heels', 'loafers'].some((t) =>
            type.includes(t),
          )
        )
          score *= 1.4;
        break;
      case 'bohemian':
        if (
          ['maxi dress', 'midi dress', 'sandals'].some((t) => type.includes(t))
        )
          score *= 1.4;
        break;
    }
  }
  return score;
}

function scoreItem(item: WardrobeItem, req: OutfitRequest): number {
  return (
    weatherSuitability(item, req.weather) *
    styleSuitability(item, req.style_preferences)
  );
}

// Sort items by score desc, then shuffle ties for regenerate variety.
function rankByScore(
  items: WardrobeItem[],
  req: OutfitRequest,
): WardrobeItem[] {
  const scored = items.map((i) => ({ item: i, score: scoreItem(i, req) }));
  shuffle(scored); // randomize ties
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.item);
}

function buildRationale(
  req: OutfitRequest,
  outfit: Omit<GeneratedOutfit, 'rationale' | 'item_ids'>,
): string {
  const parts: string[] = [];
  const hasDress = !!outfit.dress;
  const topDesc = hasDress
    ? `a ${outfit.dress!.type.toLowerCase()}`
    : `a ${outfit.top!.type.toLowerCase()} paired with ${outfit.bottom!.type.toLowerCase()}`;

  parts.push(`For a ${req.occasion.toLowerCase()} look, we styled ${topDesc}.`);

  if (outfit.shoes) {
    parts.push(`${outfit.shoes.type} complete the outfit.`);
  }
  if (outfit.bag) {
    parts.push(`A ${outfit.bag.type.toLowerCase()} adds function and polish.`);
  }
  if (outfit.accessories.length > 0) {
    const acc = outfit.accessories.map((a) => a.type.toLowerCase()).join(', ');
    parts.push(`Finished with ${acc}.`);
  }
  if (req.weather) {
    parts.push(`Tuned for ${req.weather.toLowerCase()} conditions.`);
  }
  if (req.style_preferences.length > 0) {
    parts.push(
      `Reflecting a ${req.style_preferences.join(', ').toLowerCase()} style.`,
    );
  }
  return parts.join(' ');
}

// Generate an outfit from the user's wardrobe. Returns null if required categories can't be met.
export function generateOutfit(
  items: WardrobeItem[],
  req: OutfitRequest,
): GeneratedOutfit | null {
  const compat = compatibleOccasions(req.occasion);

  // Filter to items tagged with a compatible occasion.
  const pool = items.filter((i) => i.occasions.some((o) => compat.includes(o)));

  const byCategory = (cat: CategoryId) =>
    pool.filter((i) => i.category === cat);

  const tops = rankByScore(byCategory('tops'), req);
  const bottoms = rankByScore(byCategory('bottoms'), req);
  const dresses = rankByScore(byCategory('dresses'), req);
  const shoes = rankByScore(byCategory('shoes'), req);
  const bags = rankByScore(byCategory('bags'), req);
  const accessories = rankByScore(byCategory('accessories'), req);

  // Shoes are always required.
  const chosenShoes = pickRandom(shoes);
  if (!chosenShoes) {
    return null; // cannot satisfy required shoes
  }

  // Decide: dress path vs top+bottom path.
  // Prefer dress if available AND (no tops or no bottoms), else prefer top+bottom.
  let dress: WardrobeItem | null = null;
  let top: WardrobeItem | null = null;
  let bottom: WardrobeItem | null = null;

  const hasTopBottom = tops.length > 0 && bottoms.length > 0;
  const hasDress = dresses.length > 0;

  if (hasTopBottom) {
    top = pickRandom(tops);
    bottom = pickRandom(bottoms);
  } else if (hasDress) {
    dress = pickRandom(dresses);
  } else {
    // Cannot satisfy required top+bottom or dress.
    return null;
  }

  // Bags: included when a compatible tagged item exists.
  const chosenBag = pickRandom(bags);

  // Accessories: at least one when a compatible tagged item exists.
  const chosenAccessories: WardrobeItem[] = [];
  if (accessories.length > 0) {
    // Include 1-2 accessories for variety.
    const count = Math.min(accessories.length, Math.random() > 0.5 ? 2 : 1);
    chosenAccessories.push(...shuffle(accessories).slice(0, count));
  }

  const base = {
    occasion: req.occasion,
    weather: req.weather,
    style_preferences: req.style_preferences,
    top,
    bottom,
    dress,
    shoes: chosenShoes,
    bag: chosenBag,
    accessories: chosenAccessories,
  };

  const item_ids: string[] = [];
  if (top) item_ids.push(top.id);
  if (bottom) item_ids.push(bottom.id);
  if (dress) item_ids.push(dress.id);
  if (chosenShoes) item_ids.push(chosenShoes.id);
  if (chosenBag) item_ids.push(chosenBag.id);
  chosenAccessories.forEach((a) => item_ids.push(a.id));

  const rationale = buildRationale(req, base);

  return { ...base, rationale, item_ids };
}

// Regenerate: re-run the engine to produce an alternate combination when the pool allows.
export function regenerateOutfit(
  items: WardrobeItem[],
  req: OutfitRequest,
  previous?: GeneratedOutfit,
): GeneratedOutfit | null {
  // Try a few times to get a different combination than the previous one.
  for (let attempt = 0; attempt < 8; attempt++) {
    const next = generateOutfit(items, req);
    if (!next) return null;
    if (!previous) return next;
    const same =
      next.item_ids.length === previous.item_ids.length &&
      next.item_ids.every((id) => previous.item_ids.includes(id));
    if (!same) return next;
  }
  // Fallback: return whatever we have even if identical (limited wardrobe).
  return generateOutfit(items, req);
}
