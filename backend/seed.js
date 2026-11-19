const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database('./periodic.db');

db.exec(`
    DROP TABLE IF EXISTS elements;
    CREATE TABLE elements (
    atomic_number INTEGER PRIMARY KEY,
    symbol TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    atomic_mass REAL,
    category TEXT,
    phase TEXT,
    period INTEGER,
    group_num INTEGER,
    xpos INTEGER,
    ypos INTEGER,
    block TEXT,
    electron_configuration TEXT,
    electronegativity_pauling REAL,
    appearance TEXT,
    discovered_by TEXT,
    summary TEXT,
    image_url TEXT,
    bohr_model_3d TEXT,
    shells_json TEXT,
    atomic_radii_json TEXT
    );
`); 

const rawData = JSON.parse(fs.readFileSync('./elements.json', 'utf8'));
const elements = rawData.elements;  //Acces to array of elements

const insert = db.prepare(`
    INSERT INTO elements (
    atomic_number, symbol, name, atomic_mass, category, phase,
    period, group_num, xpos, ypos, block, electron_configuration,
    electronegativity_pauling, appearance, discovered_by, summary,
    image_url, bohr_model_3d, shells_json, atomic_radii_json
  )
  VALUES (
    @atomic_number, @symbol, @name, @atomic_mass, @category, @phase,
    @period, @group_num, @xpos, @ypos, @block, @electron_configuration,
    @electronegativity_pauling, @appearance, @discovered_by, @summary,
    @image_url, @bohr_model_3d, @shells_json, @atomic_radii_json
  )
`);

const insertMany = db.transaction((items) => {
    for (const el of items) {
        insert.run({
            atomic_number: el.number,
            symbol: el.symbol,
            name: el.name,
            atomic_mass: el.atomic_mass ?? null,
            category: el.category ?? null,
            phase: el.phase ?? null,
            period: el.period ?? null,
            group_num: el.group ?? null,
            xpos: el.xpos ?? null,
            ypos: el.ypos ?? null,
            block: el.block ?? null,
            electron_configuration: el.electron_configuration ?? null,
            electronegativity_pauling: el.electronegativity_pauling ?? null,
            appearance: el.appearance ?? null,
            discovered_by: el.discovered_by ?? null,
            summary: el.summary ?? null,
            image_url: el.image?.url ?? null,
            bohr_model_3d: el.bohr_model_3d ?? null,
            shells_json: JSON.stringify(el.shells ?? []),
            atomic_radii_json: JSON.stringify(el.atomic_radii ?? {})
        });
    };
});

insertMany(elements);

console.log('Database seeded successfully.');
db.close();


