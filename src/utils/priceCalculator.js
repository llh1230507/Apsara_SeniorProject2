export function calculatePrice(basePrice, size, material) {
  const sizeMultiplier = {
    small: 1,
    medium: 1.2,
    large: 1.5,
  };

  const materialMultiplier = {
    wood: 1,
    stone: 1.4,
    metal: 1.6,
  };

  return Math.round(
    basePrice * sizeMultiplier[size] * materialMultiplier[material]
  );
}