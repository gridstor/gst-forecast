
interface CurveSet {
  curveIds: number[];
  displayOrder: number[];
}

interface LocationCurves {
  monthly: CurveSet;
  annual: CurveSet;
}

interface DefaultCurveConfig {
  [location: string]: LocationCurves;
}

export const defaultCurves: DefaultCurveConfig = {
  "CAISO-Goleta": {
    "monthly": {
      "curveIds": [
        97,
        96,
        101,
        100,
        99,
        98
      ],
      "displayOrder": [
        1,
        2,
        3,
        4,
        5,
        6
      ]
    },
    "annual": {
      "curveIds": [],
      "displayOrder": []
    }
  },
  "CAISO-SP15": {
    "monthly": {
      "curveIds": [
        108
      ],
      "displayOrder": [
        1
      ]
    },
    "annual": {
      "curveIds": [
        95,
        94,
        110,
        107,
        109,
        105,
        106
      ],
      "displayOrder": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    }
  },
  "ERCOT-Houston": {
    "monthly": {
      "curveIds": [
        104,
        102,
        103
      ],
      "displayOrder": [
        1,
        2,
        3
      ]
    },
    "annual": {
      "curveIds": [
        134,
        114,
        116,
        117,
        115,
        118,
        119,
        120,
        121,
        122,
        123
      ],
      "displayOrder": [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11
      ]
    }
  },
  "ERCOT-South": {
    "monthly": {
      "curveIds": [
        113,
        111,
        112
      ],
      "displayOrder": [
        1,
        2,
        3
      ]
    },
    "annual": {
      "curveIds": [
        124,
        135,
        126,
        127,
        125,
        128,
        129,
        130,
        131,
        132,
        133
      ],
      "displayOrder": [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11
      ]
    }
  }
};

export function isDefaultCurve(location: string, curveId: number, granularity: 'monthly' | 'annual'): boolean {
  return defaultCurves[location]?.[granularity].curveIds.includes(curveId) ?? false;
}

export function getDisplayOrder(location: string, curveId: number, granularity: 'monthly' | 'annual'): number | null {
  const index = defaultCurves[location]?.[granularity].curveIds.indexOf(curveId) ?? -1;
  return index >= 0 ? defaultCurves[location][granularity].displayOrder[index] : null;
}
