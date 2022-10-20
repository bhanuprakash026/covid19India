const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const databasePath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());
let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error : ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertDBObjToResponseObj = (eachStateObj) => {
  return {
    stateId: eachStateObj.state_id,
    stateName: eachStateObj.state_name,
    population: eachStateObj.population,
  };
};

const convertDistrictDBObjectToResponseObj = (districtObject) => {
  return {
    districtId: districtObject.district_id,
    districtName: districtObject.district_name,
    stateId: districtObject.state_id,
    cases: districtObject.cases,
    cured: districtObject.cured,
    active: districtObject.active,
    deaths: districtObject.deaths,
  };
};

//GET METHOD API 1
app.get("/states/", async (request, response) => {
  const getQuery = `
        SELECT * FROM state ORDER BY state_id;
    `;
  const statesArray = await database.all(getQuery);
  response.send(
    statesArray.map((eachStateObj) => convertDBObjToResponseObj(eachStateObj))
  );
  console.log(typeof statesArray);
});

// API 2 GET METHOD  Returns a state based on the state ID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getSingleStateQuery = `
        SELECT
          *
        FROM
          state
        WHERE
          state_id = ${stateId};
    `;
  const state = await database.get(getSingleStateQuery);
  response.send(convertDBObjToResponseObj(state));
});

//API3 METHOD POST Create a district in the district table, district_id is auto-incremented

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postQuery = `
        INSERT INTO
            district(district_name,state_id,cases,cured,active,deaths)
        VALUES(
            '${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths}
        );  
    `;
  const district = await database.run(postQuery);
  response.send("District Successfully Added");
});

//API4 GET METHOD
//Returns a district based on the district ID

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const singleDistQuery = `
        SELECT
            *
        FROM
            district
        WHERE
            district_id = ${districtId};   
    `;
  const singleDistrict = await database.get(singleDistQuery);
  response.send(convertDistrictDBObjectToResponseObj(singleDistrict));
});

//API5 DELETE METHOD
// Deletes a district from the district table based on the district ID

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
        DELETE FROM
            district
        WHERE
            district_id = ${districtId};
    `;
  const dist = await database.run(deleteQuery);
  response.send("District Removed");
});

//API6 METHOD PUT Updates the details of a specific district based on the district ID

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
        UPDATE
            district
        SET
            district_name = '${districtName}';,
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
        WHERE
            district_id = ${districtId}
    `;
  const updatedDistrict = await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API 7 METHOD GET Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getTotalQuery = `
        SELECT
            SUM(cases) AS totalCases,
            SUM(cured) AS totalCured,
            SUM(active) AS totalActive,
            SUM(deaths) AS totalDeaths
        FROM
            state NATURAL JOIN district
        WHERE
            state_id = ${stateId};
   `;
  const stateStatus = await database.get(getTotalQuery);
  response.send(stateStatus);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { stateName } = request.body;
  const { districtId } = request.params;

  const getNameQuery = `SELECT state_name 
                     FROM state  NATURAL JOIN  district WHERE district_id=${districtId};`;

  const stateNam = await database.get(getNameQuery);
  response.send(convertDBObjToResponseObj(stateNam));
});

module.exports = app;
