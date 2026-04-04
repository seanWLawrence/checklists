import {
  Journal,
  JournalRatingTypeAndValueCount,
  TotalRatingsByTypeAndValue,
} from "../journal.types";

const toTenthsDecimal = (num: number): number => Number(num.toFixed(2));

export const average = ({
  count,
  num,
}: {
  count: number;
  num: number;
}): number => (count > 0 ? toTenthsDecimal(num / count) : 0);

export const median = (
  ratings: JournalRatingTypeAndValueCount["ratings"],
): number => {
  const medianIndex = Math.floor(ratings.length / 2);

  return [...ratings.map((l) => l.rating).sort()][medianIndex];
};

export const mode = (
  ratingTypeAndValueCount: JournalRatingTypeAndValueCount,
): number => {
  let highestRatingCount = ratingTypeAndValueCount[1];
  let highestRating = 1;

  for (let i = 2; i <= 5; i++) {
    const rating = i as 2 | 3 | 4 | 5;
    const count = ratingTypeAndValueCount[rating];

    if (count > highestRatingCount) {
      highestRatingCount = count;
      highestRating = rating;
    }
  }

  return highestRating;
};

export const percentile = ({
  percentile,
  totals,
}: {
  percentile: number;
  totals: JournalRatingTypeAndValueCount;
}) => {
  const sortedNums = [
    ...totals.ratings.sort((a, b) => (a.rating < b.rating ? -1 : 1)),
  ].map((l) => l.rating);

  const rank = percentile * (sortedNums.length - 1);
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);

  if (lowerIndex === upperIndex) {
    return sortedNums[lowerIndex];
  } else {
    const lowerValue = sortedNums[lowerIndex];
    const upperValue = sortedNums[upperIndex];
    return toTenthsDecimal(
      lowerValue + (upperValue - lowerValue) * (rank - lowerIndex),
    );
  }
};

export const getTotalRatingsByTypeAndValue = (
  journals: Journal[],
): TotalRatingsByTypeAndValue => {
  const result: TotalRatingsByTypeAndValue = {
    energy: {
      name: "Energy",
      total: 0,
      ratings: [],
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
    mood: {
      name: "Mood",
      total: 0,
      ratings: [],
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
    productivity: {
      name: "Productivity",
      total: 0,
      ratings: [],
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
  };

  for (const { checkIn, updatedAtIso } of journals) {
    const energy = checkIn.ratings?.energy;
    const mood = checkIn.ratings?.mood;
    const productivity = checkIn.ratings?.productivity;

    if (energy) {
      result.energy.total += energy;
      result.energy[energy] += 1;
      result.energy.ratings.push({
        rating: energy,
        updatedAtIso,
      });
    }
    if (mood) {
      result.mood.total += mood;
      result.mood[mood] += 1;
      result.mood.ratings.push({
        rating: mood,
        updatedAtIso,
      });
    }

    if (productivity) {
      result.productivity.total += productivity;
      result.productivity[productivity] += 1;
      result.productivity.ratings.push({
        rating: productivity,
        updatedAtIso,
      });
    }
  }

  return result;
};

export const maxLevel = 5;
