// Product-level dimensions in logical points, not device pixels.
export const space={xs:4,sm:8,md:12,lg:16,xl:24,xxl:32};
export const radius={control:12,card:16,pill:999};
export const control={minTarget:48,icon:24,border:1};
export const typeStyles={
 caption:{fontSize:13,lineHeight:18},
 secondary:{fontSize:15,lineHeight:22},
 body:{fontSize:17,lineHeight:25},
 label:{fontSize:17,lineHeight:23,fontWeight:'600'},
 section:{fontSize:20,lineHeight:27,fontWeight:'700'},
 title:{fontSize:24,lineHeight:31,fontWeight:'700'},
 page:{fontSize:28,lineHeight:35,fontWeight:'700'},
};
export const typeLimits={caption:0,secondary:0,body:0,label:0,section:2,title:2,page:2};
export function adaptiveLayout(width,fontScale){
 const readingWidth=width/Math.max(1,fontScale);
 return {stack:readingWidth<300,gutter:width<360?space.md:space.lg,contentMaxWidth:720};
}

// Keep floating-action placement and scroll clearance derived from one geometry.
export const floatingAction={size:56,gap:20};
export function floatingContentInset(safeBottom=0){
 const inset=Number.isFinite(safeBottom)?Math.max(0,safeBottom):0;
 return inset+floatingAction.gap+floatingAction.size+space.lg;
}
