export type TypeAssetImageConfig = {
  label: string;
  top: number;
  "8axes"?: boolean;
};
export type TypeAssetFileConfig = {
  src: string;
  group: string;
  imgHeight: number;
  imgWidth: number;
  images?: TypeAssetImageConfig[];
  scall?: boolean;
};


function fileToGroup(filename:string) : TypeAssetFileConfig{
  return {
    "src": "./img/asset_opti/"+filename+".png",
    "group": filename,
    "imgHeight": 224,
    "imgWidth": 192,
  }
}

export const assetFileConfig: TypeAssetFileConfig[] = [
  // fileToGroup("ItemTech"),
  fileToGroup("AstroBase"),
  fileToGroup("AstroBase2"),
  fileToGroup("AstroBase3"),
  fileToGroup("AstroBase4"),
  fileToGroup("AstroBase5"),
  fileToGroup("GrokClean1"),
  
  // fileToGroup("Wall"),
  // fileToGroup("ItemPilar"),
  // fileToGroup("NatureRock"),
  // fileToGroup("AstroRocket"),
  fileToGroup("Town2"),
  // fileToGroup("NatureFlower"),
  // fileToGroup("AstroPlatform"),
  // fileToGroup("MyTower"),
  // fileToGroup("ItemOther"),
  // fileToGroup("ItemGrave"),
  // fileToGroup("Train"),
  // fileToGroup("UserAstro"),
  fileToGroup("Town1"),
  // fileToGroup("NatureTree"),
];
