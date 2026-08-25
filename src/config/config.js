// Default data to show on page load
export const default_table = "CEPHNI04";

// Lookup for geojson files
export const GEOG_PROPS= {
  LGD2014: { 
    url: "public/map/LGD2014.geo.json",
    code_var: "LGDCode",
    label: "Local Government District"
  },
  LGD: { 
    url: "public/map/LGD2014.geo.json",
    code_var: "LGDCode" ,
    label: "Local Government District"
  },
  LGD1992: {
    url: "public/map/LGD1992.geo.json",
    code_var: "LGD_CODE",
    label: "Local Government District (1992)"
  },
  AA: { 
    url: "public/map/AA.geo.json",
    code_var: "PC_ID",
    label: "Assembly Area" 
  },
  AA2024: { 
    url: "public/map/AA2024.geo.json",
    code_var: "PC_Code",
    label: "Assembly Area (2024)"
  },
  HSCT:    { 
    url: "public/map/HSCT.geo.json",
    code_var: "TrustCode",
    label: "Health and Social Care Trust"
  },
  DEA2014: { 
    url: "public/map/DEA2014.geo.json", 
    code_var: "DEA_code",
    label: "District Electoral Area" 
  },
  SDZ2021: { 
    url: "public/map/SDZ2021.geo.json",
    code_var: "SDZ21_code",
    label: "Super Data Zone"
  },
  DZ2021:  { 
    url: "public/map/DZ2021.geo.json", 
    code_var: "DZ21_code",
    label: "Data Zone"
  },
  Ward2014:{ 
    url: "public/map/Ward2014.geo.json",
    code_var: "Ward_Code",
    label: "Ward"
  },
  WARD2014:{ 
    url: "public/map/Ward2014.geo.json",
    code_var: "Ward_Code",
    label: "Ward"
  },
  SOA:     {
    url: "public/map/SOA2011.geo.json",
    code_var: "SOA_CODE",
    label: "Super Output Area"
  },
  SA:      { 
    url: "public/map/SA2011.geo.json",
    code_var: "SA2011",
    label: "Small Area"
  },
  LCG: {
    url: "public/map/HSCT.geo.json", 
    code_var: "TrustName",
    label: "Local Commisioning Group"
  },
  UR2015:  { 
    url: "public/map/UR2015.geo.json", 
    code_var: "UR_CODE" ,
    label: "Urban/Rural"
  },
  SETTLEMENT:{
    url:"public/map/UR2015.geo.json",
    code_var: "UR_CODE" ,
    label: "Urban/Rural"
  },
  NUTS3:   { 
    url: "public/map/NUTS3.geo.json", 
    code_var: "NUTS3",
    label: "NUTS3"
  },
  ELB:     { 
    url: "public/map/ELB.geo.json", 
    code_var: "ELB_Code" ,
    label: "Education and Library Board"
  },
  COB_BASIC:{
    url:"public/map/COB.geo.json", 
    code_var: "COB_BASIC",
    label: "Country of Birth"
  },
  EQUALGROUPS: {
    label: "Equality Groups"
  }

}

  // Colour palette for charts
export const palette = ["#d6e4f6", "#8db2e0", "#3878c5", "#22589c", "#00205b"];
