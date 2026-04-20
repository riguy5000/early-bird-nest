/**
 * Comprehensive TEST / DEMO intake dataset.
 *
 * Covers every category, subcategory, metal type, purity option, spec group,
 * multi-metal/multi-stone records, notes, photos (placeholder), and offer values
 * so the full Take-In → Inventory pipeline can be inspected end-to-end.
 *
 * The shape matches the in-memory Item shape used by TakeInPage / TakeInBalanced.
 * The pricing utility recomputes marketValue/payoutAmount on render where applicable,
 * but we still seed sensible numeric values so totals show correctly even before any
 * recompute / live spot price refresh runs.
 */

const PLACEHOLDER = (label: string) =>
  `https://placehold.co/600x600/f1f5f9/334155?text=${encodeURIComponent(label)}`;

const uid = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export interface DemoMetal {
  id: string;
  type: string;
  karat: number; // karat for Gold (≤24), fineness for Silver/Pt/Pd (>24)
  weight: number;
  marketValue?: number;
  payoutAmount?: number;
  payoutPercentage?: number;
}

export interface DemoStone {
  id: string;
  type: string;
  shape?: string;
  color?: string;
  clarity?: string;
  cut?: string;
  size?: number;
  carats?: number;
  quantity?: number;
  labCert?: string;
  reportNumber?: string;
  treatment?: string;
  origin?: string;
  natural?: boolean;
  measurements?: string;
}

export interface DemoItem {
  id: string;
  category: 'Jewelry' | 'Watch' | 'Bullion' | 'Stones' | 'Silverware' | 'LooseItems';
  subType?: string;
  itemType?: string;
  metals: DemoMetal[];
  stones: DemoStone[];
  watchInfo?: Record<string, any>;
  specs?: Record<string, any>;
  marketValue: number;
  payoutPercentage: number;
  payoutAmount: number;
  photos: string[];
  notes: string;
  testMethod?: 'Loop' | 'Acid' | 'XRF' | 'Melt';
  status: 'In Stock' | 'Melted' | 'Resold' | 'Used Toward Sale';
  source?: string;
  colorNotes?: string;
}

const m = (type: string, karat: number, weight: number): DemoMetal => ({
  id: uid('metal'),
  type,
  karat,
  weight,
});

const s = (extra: Partial<DemoStone>): DemoStone => ({
  id: uid('stone'),
  type: extra.type || 'Diamond',
  ...extra,
});

export function buildDemoItems(defaultPayoutPercentage = 75): DemoItem[] {
  const pct = defaultPayoutPercentage;

  const items: DemoItem[] = [
    // ───────── JEWELRY ─────────
    {
      id: uid('item'),
      category: 'Jewelry',
      subType: 'Ring',
      itemType: 'Ring',
      metals: [m('Gold', 14, 6.4)],
      stones: [],
      specs: { ringSize: '7', condition: 'Good', hallmarks: '585', color: 'Yellow' },
      marketValue: 320, payoutPercentage: pct, payoutAmount: 240,
      photos: [PLACEHOLDER('14K Gold Ring')],
      notes: 'Classic yellow gold band. Light wear, no stones. Hallmark visible inside band.',
      testMethod: 'Acid', status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'Jewelry',
      subType: 'Ring',
      itemType: 'Ring',
      metals: [m('Silver', 925, 5.2)],
      stones: [],
      specs: { ringSize: '8', condition: 'Excellent', hallmarks: '925' },
      marketValue: 18, payoutPercentage: pct, payoutAmount: 13.5,
      photos: [PLACEHOLDER('925 Silver Ring')],
      notes: 'Sterling silver ring with engraved pattern.',
      testMethod: 'Loop', status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'Jewelry',
      subType: 'Ring',
      itemType: 'Ring',
      metals: [m('Platinum', 950, 8.7)],
      stones: [s({ type: 'Diamond', shape: 'Round', carats: 0.75, color: 'G', clarity: 'VS1', cut: 'Excellent', quantity: 1, natural: true })],
      specs: { ringSize: '6', condition: 'Excellent', hallmarks: 'PT950' },
      marketValue: 1850, payoutPercentage: pct, payoutAmount: 1387.5,
      photos: [PLACEHOLDER('Platinum Diamond Ring')],
      notes: 'Solitaire engagement ring, 6-prong setting.',
      testMethod: 'XRF', status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'Jewelry',
      subType: 'Pendant',
      itemType: 'Pendant',
      metals: [m('Palladium', 950, 4.2)],
      stones: [],
      specs: { condition: 'Good', hallmarks: 'PD950' },
      marketValue: 240, payoutPercentage: pct, payoutAmount: 180,
      photos: [PLACEHOLDER('Palladium Pendant')],
      notes: 'Modern palladium pendant, no chain included.',
      testMethod: 'XRF', status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'Jewelry',
      subType: 'Bracelet',
      itemType: 'Bracelet',
      metals: [m('Gold', 18, 12.1), m('Platinum', 950, 3.4)],
      stones: [],
      specs: { length: '7.5"', condition: 'Excellent', color: 'Two-tone' },
      marketValue: 1240, payoutPercentage: pct, payoutAmount: 930,
      photos: [PLACEHOLDER('Two-Tone Bracelet'), PLACEHOLDER('Bracelet Clasp')],
      notes: 'Two-tone bracelet with 18K yellow gold links and platinum accents.',
      testMethod: 'XRF', status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'Jewelry',
      subType: 'Pendant',
      itemType: 'Pendant',
      metals: [m('Gold', 18, 9.5)],
      stones: [
        s({ type: 'Diamond', shape: 'Round', carats: 0.5, color: 'F', clarity: 'VVS2', quantity: 1, natural: true }),
        s({ type: 'Sapphire', shape: 'Oval', carats: 1.2, color: 'Blue', quantity: 2, treatment: 'Heat', origin: 'Sri Lanka' }),
      ],
      specs: { condition: 'Excellent', hallmarks: '750' },
      marketValue: 2100, payoutPercentage: pct, payoutAmount: 1575,
      photos: [PLACEHOLDER('Diamond + Sapphire Pendant')],
      notes: 'Halo-style pendant with diamond center and sapphire accents.',
      testMethod: 'XRF', status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'Jewelry',
      subType: 'Necklace',
      itemType: 'Chain',
      metals: [m('Gold', 22, 22.0)],
      stones: [],
      specs: { length: '20"', condition: 'Good', hallmarks: '916' },
      marketValue: 1900, payoutPercentage: pct, payoutAmount: 1425,
      photos: [PLACEHOLDER('22K Gold Chain')],
      notes: '22K rope chain, single broken link near clasp.',
      testMethod: 'Acid', status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'Jewelry',
      subType: 'Earrings',
      itemType: 'Earrings',
      metals: [m('Gold', 10, 2.4)],
      stones: [s({ type: 'Diamond', shape: 'Round', carats: 0.1, quantity: 2, natural: true })],
      specs: { pair: 'Pair', condition: 'Good' },
      marketValue: 95, payoutPercentage: pct, payoutAmount: 71.25,
      photos: [PLACEHOLDER('10K Diamond Studs')],
      notes: 'Matched pair of 10K studs with small accent diamonds.',
      testMethod: 'Acid', status: 'In Stock', source: 'Demo',
    },

    // ───────── WATCH ─────────
    {
      id: uid('item'),
      category: 'Watch',
      subType: 'Wristwatch',
      itemType: 'Wristwatch',
      metals: [],
      stones: [],
      watchInfo: {
        brand: 'Rolex', model: 'Submariner Date', reference: '116610LN',
        serial: 'M123456', condition: 'Excellent', dialColor: 'Black',
        caseSize: '40mm', movement: 'Automatic', band: 'Oyster Steel',
        working: true, boxIncluded: true, papersIncluded: true,
      },
      specs: { boxIncluded: true, papersIncluded: true, working: true },
      marketValue: 11500, payoutPercentage: 70, payoutAmount: 8050,
      photos: [PLACEHOLDER('Rolex Submariner'), PLACEHOLDER('Watch Box & Papers')],
      notes: 'Full set with box and papers from 2018. Recent service.',
      status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'Watch',
      subType: 'Wristwatch',
      itemType: 'Wristwatch',
      metals: [],
      stones: [],
      watchInfo: {
        brand: 'Omega', model: 'Speedmaster Professional', reference: '311.30.42.30.01.005',
        serial: '88123456', condition: 'Good', dialColor: 'Black',
        caseSize: '42mm', movement: 'Manual', band: 'Steel',
        working: true, boxIncluded: false, papersIncluded: false,
      },
      specs: { boxIncluded: false, papersIncluded: false, working: true },
      marketValue: 3200, payoutPercentage: 65, payoutAmount: 2080,
      photos: [PLACEHOLDER('Omega Speedmaster')],
      notes: 'No box or papers. Light scratches on bezel, runs strong.',
      status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'Watch',
      subType: 'Pocket Watch',
      itemType: 'Pocket Watch',
      metals: [m('Gold', 14, 48.0)],
      stones: [],
      watchInfo: {
        brand: 'Waltham', model: 'Vanguard', movement: 'Manual', working: true,
        condition: 'Good',
      },
      specs: { working: true, caseMetal: '14K Gold' },
      marketValue: 1400, payoutPercentage: pct, payoutAmount: 1050,
      photos: [PLACEHOLDER('Antique Pocket Watch')],
      notes: 'Antique 14K gold case pocket watch. Movement runs.',
      testMethod: 'Acid', status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'Watch',
      subType: 'Watch Head Only',
      itemType: 'Watch Head Only',
      metals: [],
      stones: [],
      watchInfo: {
        brand: 'Tag Heuer', model: 'Carrera', condition: 'For Parts',
        movement: 'Automatic', working: false,
      },
      specs: { working: false, forParts: true },
      marketValue: 250, payoutPercentage: 50, payoutAmount: 125,
      photos: [PLACEHOLDER('Watch Head For Parts')],
      notes: 'Non-running movement, dial cracked. Sold for parts.',
      status: 'In Stock', source: 'Demo',
    },

    // ───────── BULLION / COINS ─────────
    {
      id: uid('item'),
      category: 'Bullion',
      subType: 'Gold Coin',
      itemType: 'Bullion Coin',
      metals: [m('Gold', 22, 33.93)],
      stones: [],
      specs: {
        mint: 'US Mint', year: '2021', denomination: '$50',
        coinName: 'American Gold Eagle', quantity: 1, assayCard: false,
      },
      marketValue: 2050, payoutPercentage: 95, payoutAmount: 1947.5,
      photos: [PLACEHOLDER('Gold Eagle Coin')],
      notes: '1 oz American Gold Eagle, brilliant uncirculated.',
      status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'Bullion',
      subType: 'Silver Bar',
      itemType: 'Bullion Bar',
      metals: [m('Silver', 999, 311.0)],
      stones: [],
      specs: {
        refinery: 'PAMP Suisse', serialNumber: 'PS-883124', quantity: 1,
        assayCard: true, weightStated: '10 oz',
      },
      marketValue: 285, payoutPercentage: 92, payoutAmount: 262.2,
      photos: [PLACEHOLDER('PAMP Silver Bar'), PLACEHOLDER('Assay Card')],
      notes: '10 oz PAMP Suisse silver bar with original assay card.',
      status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'Bullion',
      subType: 'Platinum Bar',
      itemType: 'Bullion Bar',
      metals: [m('Platinum', 999, 31.1)],
      stones: [],
      specs: { refinery: 'Valcambi', serialNumber: 'VC-552981', quantity: 1, assayCard: true },
      marketValue: 980, payoutPercentage: 90, payoutAmount: 882,
      photos: [PLACEHOLDER('Platinum Bar')],
      notes: '1 oz Valcambi platinum bar, sealed in assay card.',
      status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'Bullion',
      subType: 'Numismatic Coin',
      itemType: 'Collectible Coin',
      metals: [m('Gold', 22, 8.36)],
      stones: [],
      specs: {
        country: 'United States', year: '1908', mintMark: 'D',
        denomination: '$20', coinName: 'Saint-Gaudens Double Eagle',
        gradingService: 'PCGS', grade: 'MS-63', slabbed: true, quantity: 1,
      },
      marketValue: 2400, payoutPercentage: 88, payoutAmount: 2112,
      photos: [PLACEHOLDER('Saint-Gaudens Coin')],
      notes: 'PCGS slabbed Saint-Gaudens, attractive luster, premium over melt.',
      status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'Bullion',
      subType: 'Coin Lot',
      itemType: 'Coin Lot',
      metals: [m('Silver', 900, 187.5)],
      stones: [],
      specs: {
        country: 'United States', denomination: 'Mixed (Quarters/Halves)',
        quantity: 24, lotType: 'Junk Silver',
      },
      marketValue: 165, payoutPercentage: 90, payoutAmount: 148.5,
      photos: [PLACEHOLDER('90% Silver Coin Lot')],
      notes: 'Pre-1965 US 90% silver coin lot, mixed quarters and halves.',
      status: 'In Stock', source: 'Demo',
    },

    // ───────── LOOSE STONES ─────────
    {
      id: uid('item'),
      category: 'Stones',
      subType: 'Diamond',
      itemType: 'Loose Stone',
      metals: [],
      stones: [s({
        type: 'Diamond', shape: 'Round', carats: 1.02, color: 'G', clarity: 'VS1',
        cut: 'Excellent', natural: true, labCert: 'GIA', reportNumber: '2185639472',
        measurements: '6.45 x 6.48 x 3.96 mm', quantity: 1,
      })],
      specs: {
        polish: 'Excellent', symmetry: 'Excellent', fluorescence: 'None',
      },
      marketValue: 5800, payoutPercentage: 70, payoutAmount: 4060,
      photos: [PLACEHOLDER('GIA Diamond'), PLACEHOLDER('GIA Cert')],
      notes: '1.02ct GIA-certified round brilliant. Triple Excellent.',
      status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'Stones',
      subType: 'Sapphire',
      itemType: 'Loose Stone',
      metals: [],
      stones: [s({
        type: 'Sapphire', shape: 'Cushion', carats: 3.15, color: 'Royal Blue',
        natural: true, treatment: 'Heat', origin: 'Ceylon (Sri Lanka)',
        labCert: 'GRS', reportNumber: 'GRS2023-091445',
        measurements: '8.20 x 7.10 x 5.30 mm', quantity: 1,
      })],
      specs: {},
      marketValue: 4200, payoutPercentage: 65, payoutAmount: 2730,
      photos: [PLACEHOLDER('Ceylon Sapphire')],
      notes: 'Heat-treated Ceylon sapphire with GRS report.',
      status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'Stones',
      subType: 'Diamond',
      itemType: 'Matched Pair',
      metals: [],
      stones: [s({
        type: 'Diamond', shape: 'Princess', carats: 1.50, color: 'H', clarity: 'SI1',
        natural: true, quantity: 2, measurements: '5.30 x 5.30 mm each',
      })],
      specs: { matchedPair: true, totalCarats: 1.50 },
      marketValue: 2800, payoutPercentage: 65, payoutAmount: 1820,
      photos: [PLACEHOLDER('Matched Princess Pair')],
      notes: 'Matched princess-cut pair (0.75ct each), suitable for studs.',
      status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'Stones',
      subType: 'Melee Parcel',
      itemType: 'Stone Lot',
      metals: [],
      stones: [s({
        type: 'Diamond Melee', shape: 'Round', carats: 12.4, quantity: 320,
        color: 'G-I', clarity: 'SI', natural: true,
      })],
      specs: {
        averageSize: '1.2mm', mixedTypes: false, totalCarats: 12.4,
        parcelNotes: 'Round melee, near-colorless, eye-clean',
      },
      marketValue: 3200, payoutPercentage: 55, payoutAmount: 1760,
      photos: [PLACEHOLDER('Melee Diamond Parcel')],
      notes: 'Mixed melee parcel — approx 320 stones totaling 12.4ctw.',
      status: 'In Stock', source: 'Demo',
    },

    // ───────── SILVERWARE ─────────
    {
      id: uid('item'),
      category: 'Silverware',
      subType: 'Flatware Set',
      itemType: 'Flatware',
      metals: [m('Silver', 925, 1820)],
      stones: [],
      specs: {
        maker: 'Towle', pattern: 'Old Master', pieceCount: 48,
        weighted: false, grossWeight: 1820, hallmarks: 'STERLING 925',
        monogram: false, condition: 'Excellent',
      },
      marketValue: 1550, payoutPercentage: 80, payoutAmount: 1240,
      photos: [PLACEHOLDER('Sterling Flatware Set')],
      notes: '48-piece Towle "Old Master" sterling flatware set, service for 8.',
      testMethod: 'XRF', status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'Silverware',
      subType: 'Candlestick',
      itemType: 'Hollowware',
      metals: [m('Silver', 925, 165)],
      stones: [],
      specs: {
        maker: 'Gorham', pattern: 'Strasbourg', pieceCount: 2,
        weighted: true, hollowHandle: true,
        grossWeight: 420, netSilverWeight: 165, condition: 'Good',
      },
      marketValue: 140, payoutPercentage: 75, payoutAmount: 105,
      photos: [PLACEHOLDER('Weighted Candlesticks')],
      notes: 'Weighted Gorham candlestick pair. Net silver weight estimated.',
      testMethod: 'Acid', status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'Silverware',
      subType: 'Tea Set',
      itemType: 'Hollowware',
      metals: [m('Silver', 925, 1240)],
      stones: [],
      specs: {
        maker: 'Tiffany & Co.', pattern: 'Hampton', pieceCount: 5,
        weighted: false, grossWeight: 1240, hallmarks: 'TIFFANY STERLING',
        monogram: true, monogramText: 'WHM', condition: 'Good',
      },
      marketValue: 1050, payoutPercentage: 80, payoutAmount: 840,
      photos: [PLACEHOLDER('Tiffany Tea Set'), PLACEHOLDER('Hallmark Closeup')],
      notes: '5-piece Tiffany sterling tea set with monogram.',
      status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'Silverware',
      subType: 'Tray',
      itemType: 'Silver Plate',
      metals: [],
      stones: [],
      specs: {
        silverType: 'Silver Plate', maker: 'Reed & Barton',
        pieceCount: 1, condition: 'Good',
      },
      marketValue: 25, payoutPercentage: 50, payoutAmount: 12.5,
      photos: [PLACEHOLDER('Silver Plate Tray')],
      notes: 'Decorative silver-plate serving tray, no scrap value.',
      status: 'In Stock', source: 'Demo',
    },

    // ───────── LOOSE ITEMS / SCRAP ─────────
    {
      id: uid('item'),
      category: 'LooseItems',
      subType: 'Mixed Metal Lot',
      itemType: 'Scrap Lot',
      metals: [m('Gold', 14, 18.5), m('Gold', 10, 9.2), m('Silver', 925, 35.0)],
      stones: [],
      specs: {
        lotType: 'Mixed Precious Metals', mixedMetals: true,
        piecesCount: 22, stonePresence: false,
      },
      marketValue: 1180, payoutPercentage: pct, payoutAmount: 885,
      photos: [PLACEHOLDER('Mixed Scrap Lot')],
      notes: 'Mixed lot of broken chains, single earrings, and bent rings.',
      testMethod: 'XRF', status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'LooseItems',
      subType: 'Dental Gold',
      itemType: 'Dental Gold',
      metals: [m('Gold', 16, 14.8)],
      stones: [],
      specs: {
        lotType: 'Dental Gold', piecesCount: 6, estimatedPurity: '60-70% gold',
      },
      marketValue: 580, payoutPercentage: 80, payoutAmount: 464,
      photos: [PLACEHOLDER('Dental Gold')],
      notes: 'Dental gold lot — crowns and bridges, mixed alloy.',
      testMethod: 'XRF', status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'LooseItems',
      subType: 'Broken Jewelry',
      itemType: 'Scrap Lot',
      metals: [m('Gold', 14, 11.0)],
      stones: [],
      specs: {
        lotType: 'Broken Jewelry', piecesCount: 8, stonePresence: true,
        description: 'Various broken chains and pendants with small accent stones',
      },
      marketValue: 540, payoutPercentage: pct, payoutAmount: 405,
      photos: [PLACEHOLDER('Broken Jewelry Lot')],
      notes: 'Broken jewelry lot, stones not removed.',
      status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'LooseItems',
      subType: 'Watch Scrap',
      itemType: 'Watch Parts',
      metals: [m('Gold', 18, 22.0)],
      stones: [],
      specs: {
        lotType: 'Watch Cases / Parts', piecesCount: 4,
        description: 'Empty 18K gold watch cases, no movements',
      },
      marketValue: 1250, payoutPercentage: pct, payoutAmount: 937.5,
      photos: [PLACEHOLDER('Gold Watch Cases')],
      notes: 'Four empty 18K gold watch cases for melt.',
      testMethod: 'XRF', status: 'In Stock', source: 'Demo',
    },
    {
      id: uid('item'),
      category: 'LooseItems',
      subType: 'Unknown Hallmark',
      itemType: 'Untested Lot',
      metals: [m('Gold', 14, 6.0)],
      stones: [],
      specs: {
        lotType: 'Unknown Precious', piecesCount: 3,
        hallmarks: '585 / 14K / Unmarked', testedBy: 'Acid + XRF',
        description: 'Mixed pieces, partial hallmarks',
      },
      marketValue: 290, payoutPercentage: pct, payoutAmount: 217.5,
      photos: [PLACEHOLDER('Unknown Hallmark Lot')],
      notes: 'Three pieces with partial hallmarks; tested as 14K equivalent.',
      testMethod: 'Acid', status: 'In Stock', source: 'Demo',
    },
  ];

  return items;
}
