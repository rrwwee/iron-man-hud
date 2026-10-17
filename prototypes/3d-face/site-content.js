// User-supplied CV, profile links and ordered media choices.
export const videos = [
  {id:'aNNdVZ-mVy4',title:'I Am Iron Man — 2008 press conference',kind:'Video'},
  {id:'2gA-3T-95YQ',title:'The Shape of Speed — North Sails trim',kind:'Video'},
];
export const entries = [
  {id:'cv',label:'Curriculum vitae',kind:'Text',title:'Rory Collins',html:`
    <h1>Rory Collins</h1>
    <div class="cv-contact"><a href="mailto:collins.roryf@gmail.com">collins.roryf@gmail.com</a><a href="https://github.com/rrwwee" target="_blank" rel="noopener noreferrer">github.com/rrwwee</a><a href="https://www.linkedin.com/in/roryfcollins/" target="_blank" rel="noopener noreferrer">linkedin.com/in/roryfcollins/</a></div>
    <h2>EDUCATION</h2>
    <h3>MSc Artificial Intelligence</h3><p class="cv-position"><strong>University of Edinburgh</strong><small>Sep ’25 – Aug ’26</small></p>
    <ul><li>Distinction</li><li>Dissertation: <em>Mechanistic Interpretability of Vision–Language Models</em></li></ul>
    <h3>BSc Theoretical Physics</h3><p class="cv-position"><strong>University of Galway</strong><small>Sep ’21 – May ’25</small></p>
    <ul><li>First-Class Honours</li><li>Highest mark in final-year project (mBryonics Prize in Physics)</li><li>Scholarship (University Scholars)</li><li>Dissertation: <em>Estimating the Potential for Marine Heatwaves</em></li></ul>
    <h3>Semester Abroad <span>(Theoretical Physics, Computer Science)</span></h3><p class="cv-position"><strong>University of California, Santa Barbara</strong><small>Jan ’24 – Jun ’24</small></p>
    <ul><li>1 of 2 students selected from the College of Science and Engineering to study abroad in California</li></ul>
    <h2>EXPERIENCE</h2><h3>Software Developer</h3><p class="cv-position"><strong>Aramis – <a href="https://aramis.dev" target="_blank" rel="noopener noreferrer">aramis.dev</a></strong><small>Dec ’21 – Present</small></p>
    <ul><li>Generated product descriptions at 10,000 requests per month using FastAPI</li><li>Scraped product data to increase coverage from 5% to 40% using Pydantic</li><li>Automated linting and testing for 300 pull requests using GitHub Actions</li><li>Worked over 2,100 hours as a part-time contractor alongside my degrees</li><li>Progressed from intern to independently implementing and deploying customer requests</li></ul>
    <h3>Sailing Instructor</h3><p class="cv-position"><strong>Miles River Yacht Club / Winter Harbor Yacht Club</strong><small>Jun ’22 – Aug ’23</small></p><ul><li>Instructed groups of up to 9 beginners</li><li>Managed safety, equipment, and progression planning</li></ul>
    <h2>ACHIEVEMENTS &amp; AWARDS</h2><ul><li>1st place at national intervarsity Capture-the-Flag cybersecurity competition</li><li>1st university team at open sailing competition (Glasgow Grouse)</li><li>Best Male Lead Vocal national nomination for my school musical</li></ul>
    <h2>INTERESTS</h2><ul><li>Competed internationally in swimming and sailing; swimming, sailing, kitesurfing, piano</li></ul>
    <p class="cv-download"><a href="./assets/rory-collins-cv.pdf" target="_blank" rel="noopener">Download original CV</a></p>`},
  videos.length?{id:'video',label:'Media',kind:'Video',title:'Media',videos}:{id:'video',label:'Media',kind:'Text',title:'Media',html:'<p>No media is currently available.</p>'},
  {id:'x',label:'X · @rrwwe_e',kind:'External',href:'https://x.com/rrwwe_e'},
  {id:'linkedin',label:'LinkedIn',kind:'External',href:'https://www.linkedin.com/in/roryfcollins/'},
  {id:'about',label:'About this HUD',kind:'Text',title:'About',
    previewHtml:`<p>made with codex, <a href="https://github.com/rrwwee/iron-man-hud" target="_blank" rel="noopener noreferrer">source here</a></p>`,
    html:`<h1>Credits</h1>
      <p>Made with Codex by Rory Collins. <a href="https://github.com/rrwwee/iron-man-hud" target="_blank" rel="noopener noreferrer">Source here</a>.</p>
      <h2>Rendering</h2><p>Built with <a href="https://threejs.org/" target="_blank" rel="noopener noreferrer">Three.js</a>. HUD instrumentation, layouts and kitesurf equipment geometry authored for this site.</p>
      <h2>Portrait &amp; equipment</h2><p>Rory’s portrait uses his own reference video, a local capture and a fitted FaceBuilder model. The equipment depicts his O’Neill Epic wetsuit and Mystic Warrior harness, modelled from personal references.</p>
      <h2>Globe</h2><p>Map outlines from <a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener noreferrer">Natural Earth</a>, public domain.</p>`},
];
