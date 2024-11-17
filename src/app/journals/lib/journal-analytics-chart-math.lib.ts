import {
  JournalLevelTypeAndValueCount,
  JournalLevels,
  TotalLevelsByTypeAndValue,
} from "../journal.types";

const toTenthsDecimal = (num: number): number => Number(num.toFixed(2));

export const average = ({
  total,
  num,
}: {
  total: number;
  num: number;
}): number => toTenthsDecimal(num / total);

export const median = (
  levels: JournalLevelTypeAndValueCount["levels"],
): number => {
  const medianIndex = Math.floor(levels.length / 2);

  return [...levels.sort()][medianIndex];
};

export const mode = (
  levelTypeAndValueCount: JournalLevelTypeAndValueCount,
): number => {
  let highestLevelCount = levelTypeAndValueCount[1];
  let highestLevel = 1;

  for (let i = 2; i <= 5; i++) {
    const level = i as 2 | 3 | 4 | 5;
    const count = levelTypeAndValueCount[level];

    if (count > highestLevelCount) {
      highestLevelCount = count;
      highestLevel = level;
    }
  }

  return highestLevel;
};

export const percentile = ({
  percentile,
  totals,
}: {
  percentile: number;
  totals: JournalLevelTypeAndValueCount;
}) => {
  const sortedNums = [...totals.levels.sort()];

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

export const getTotalLevelsByTypeAndValue = (
  levels: JournalLevels[],
): TotalLevelsByTypeAndValue => {
  const result: TotalLevelsByTypeAndValue = {
    energyLevel: {
      name: "Energy",
      total: 0,
      levels: [],
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
    moodLevel: {
      name: "Mood",
      total: 0,
      levels: [],
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
    healthLevel: {
      name: "Health",
      total: 0,
      levels: [],
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
    creativityLevel: {
      name: "Creativity",
      total: 0,
      levels: [],
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
    relationshipsLevel: {
      name: "Relationships",
      total: 0,
      levels: [],
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
  };

  for (const {
    creativityLevel,
    energyLevel,
    moodLevel,
    healthLevel,
    relationshipsLevel,
  } of levels) {
    if (energyLevel) {
      const num = Number(energyLevel);
      result.energyLevel.total += num;
      result.energyLevel[energyLevel] += 1;
      result.energyLevel.levels.push(num);
    }
    if (moodLevel) {
      const num = Number(moodLevel);
      result.moodLevel.total += num;
      result.moodLevel[moodLevel] += 1;
      result.moodLevel.levels.push(num);
    }

    if (healthLevel) {
      const num = Number(healthLevel);
      result.healthLevel.total += num;
      result.healthLevel[healthLevel] += 1;
      result.healthLevel.levels.push(num);
    }

    if (creativityLevel) {
      const num = Number(creativityLevel);
      result.creativityLevel.total += num;
      result.creativityLevel[creativityLevel] += 1;
      result.creativityLevel.levels.push(num);
    }

    if (relationshipsLevel) {
      const num = Number(relationshipsLevel);
      result.relationshipsLevel.total += num;
      result.relationshipsLevel[relationshipsLevel] += 1;
      result.relationshipsLevel.levels.push(num);
    }
  }

  return result;
};

// Max level, this is what it's called in the Recharts
export const maxLevel = 5;
