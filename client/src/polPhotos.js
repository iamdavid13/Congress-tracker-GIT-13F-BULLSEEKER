/* Politician name → Bioguide ID mapping for official Congress photos */
const bioguideIds = {
  "Nancy Pelosi":           "P000197",
  "Tommy Tuberville":       "T000278",
  "Dan Goldman":            "G000599",
  "Ro Khanna":              "K000389",
  "Michael McCaul":         "M001157",
  "John Hickenlooper":      "H001061",
  "John W. Hickenlooper":   "H001061",
  "Shelley Moore Capito":   "C001047",
  "Andy Biggs":             "B001302",
  "Sheri Biggs":            "B001320",
  "Markwayne Mullin":       "M001190",
  "Cynthia Lummis":         "L000571",
  "Maria Cantwell":         "C000127",
  "Mark Kelly":             "K000377",
  "Jon Ossoff":             "O000174",
  "Josh Gottheimer":        "G000583",
  "Pete Ricketts":          "R000618",
  "Tim Scott":              "S001184",
  "Bill Hagerty":           "H000601",
  "Marsha Blackburn":       "B001243",
  "Ted Cruz":               "C001098",
  "John Cornyn":            "C001056",
  "Rick Scott":             "S001217",
  "Kevin Hern":             "H001082",
  "Pat Fallon":             "F000246",
  "Gary Palmer":            "P000609",
  "Thomas Massie":          "M001184",
  "Dave Joyce":             "J000295",
  "Mike Carey":             "C001126",
  "Brian Mast":             "M001199",
  "Don Beyer":              "B001292",
  "Virginia Foxx":          "F000450",
  "Lois Frankel":           "F000462",
  "Susie Lee":              "L000590",
  "Lisa McClain":           "M001136",
  "Diana Harshbarger":      "H001086",
  "Darrell Issa":           "I000056",
  "Mark R. Warner":         "W000805",
  "Gilbert Cisneros":       "C001123",
  "David Taylor":            "T000486",
  "Ami Delaney":             "D000632",
};

/**
 * Get the official Congress.gov headshot URL for a politician.
 * Returns null if the politician isn't in our mapping.
 */
export function getPolPhoto(name) {
  const id = bioguideIds[name];
  if (!id) return null;
  return `https://bioguide.congress.gov/bioguide/photo/${id[0]}/${id}.jpg`;
}
