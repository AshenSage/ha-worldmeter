const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const project=path.resolve(__dirname,'..');
const output=path.join(project,'test-results');fs.mkdirSync(output,{recursive:true});
(async()=>{
  const launch={headless:true,args:['--no-sandbox']};
  if(process.env.KRISENRADAR_BROWSER_PATH)launch.executablePath=process.env.KRISENRADAR_BROWSER_PATH;
  const browser=await chromium.launch(launch);
  const errors=[];
  for(const width of [768,390,320]){
    const context=await browser.newContext({viewport:{width,height:1400},hasTouch:width<500,isMobile:width<500});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('file://'+path.join(project,'preview.html'));
    const card=page.locator('krisenradar-card').first();
    await card.locator('.kr-countries path').first().waitFor();
    if(await card.locator('.kr-countries path').count()!==176)throw new Error('Country geometry missing');
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Horizontal overflow at '+width);
    await card.screenshot({path:path.join(output,`mobile-${width}.png`)});
    await card.locator('[data-layer="outbreak"]').click();
    if(await card.locator('.kr-rad-count').innerText()!=='0')throw new Error('Layer filter failed');
    await card.locator('[data-region="swiss"]').click();
    if(await card.locator('.kr-detail').isVisible())throw new Error('Empty region retains a misleading detail');
    await card.locator('[data-layer="radiation"]').click();
    if(await card.locator('.kr-rad-count').innerText()!=='2')throw new Error('Swiss radiation region failed');
    await card.locator('[data-region="balkan"]').click();
    await card.locator('.kr-point').first().click();
    await card.locator('[data-layer="all"]').click();
    await card.locator('[data-region="world"]').click();
    await card.locator('.kr-report-row').first().click();
    if(await card.locator('.kr-detail-name').innerText()!=='Dengue')throw new Error('Detail selection failed');
    await card.locator('.kr-more').click();
    if(await card.locator('.kr-report-row').count()!==26)throw new Error('Expanded example count failed');
    // A normal hass update must not reset user selection or view state.
    await card.locator('[data-region="balkan"]').click();
    await page.evaluate(()=>document.querySelector('krisenradar-card').hass={states:{}});
    if(await card.locator('[data-region="balkan"]').getAttribute('aria-pressed')!=='true')throw new Error('hass update resets UI');
    await page.evaluate(()=>{
      const card=document.querySelector('krisenradar-card');
      card.setConfig({title:'Krisenradar Test',region:'swiss',layer:'radiation',max_items:1,show_clock:false,demo:true});
    });
    if(await card.locator('h2').innerText()!=='Krisenradar Test')throw new Error('Custom title failed');
    if(await card.locator('.kr-clock').isVisible())throw new Error('Clock option failed');
    if(await card.locator('.kr-report-row').count()!==1)throw new Error('max_items option failed');
    const validations=await page.evaluate(()=>{
      const c=document.querySelector('krisenradar-card');
      return [{demo:false},{region:'bad'},{layer:'bad'},{max_items:0},{max_items:1.5}].map(cfg=>{try{c.setConfig(cfg);return false;}catch{return true;}});
    });
    if(validations.some(v=>!v))throw new Error('Invalid configuration accepted');
    await page.evaluate(()=>{
      const second=document.createElement('krisenradar-card');
      second.setConfig({region:'europe',demo:true});
      document.body.append(second);
    });
    const second=page.locator('krisenradar-card').nth(1);
    await second.locator('[data-layer="outbreak"]').click();
    if(await card.locator('[data-layer="radiation"]').getAttribute('aria-pressed')!=='true')throw new Error('Cards share UI state');
    // Exercise cleanup and reconnect, including resize observer reinstallation.
    await page.evaluate(()=>{const second=document.querySelectorAll('krisenradar-card')[1];second.remove();document.body.append(second);});
    await second.locator('.kr-point').first().waitFor();
    await context.close();
    console.log('PASS width '+width);
  }
  await browser.close();
  if(errors.length)throw new Error(errors.join('\n'));
  console.log('PASS: responsive map, filter/region states, detail selection, HA configuration, invalid/live config rejection, independent cards and lifecycle.');
})().catch(e=>{console.error(e);process.exit(1)});
