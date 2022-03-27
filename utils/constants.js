const PLACEMENT_POINTS = {
  1: 30,
  2: 20,
  3: 18,
  4: 16,
  5: 14,
  6: 12,
  7: 10,
  8: 9,
  9: 8,
  10: 7,
  15: 6,
  20: 5,
  25: 4,
  30: 3,
  40: 2,
  50: 1,
};

const PER_HOLE_SCORING_POINTS = {
  '-3': 20,
  '-2': 8,
  '-1': 3,
  0: 0.5,
  1: -0.5,
  2: -1,
};

module.exports = {
  PLACEMENT_POINTS,
  PER_HOLE_SCORING_POINTS,
};
