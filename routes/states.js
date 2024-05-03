
const express = require('express');
const router = express.Router();

const States = require('../models/States.js');
const statesData = require('../statesData.json');

const contiguousStates = ["AK", "HI"];



// Get states based on contiguous query parameter
router.get('/', async (req, res) => {
    if (req.query.contig) {
        const contiguous = req.query.contig === 'false' ? false : true;
        const filteredStates = statesData.filter(state => contiguous !== contiguousStates.includes(state.code));
        const stateFunFacts = await States.find({}, 'stateCode funfacts');
        const mergedStates = filteredStates.map(state => {
            const matchingMongoDBState = stateFunFacts.find(s => s.stateCode === state.code);
            return { ...state, funfacts: matchingMongoDBState ? matchingMongoDBState.funfacts : [] };
        })
        return res.json(mergedStates);


    }
    // get all
    const stateFunFacts = await States.find({}, 'stateCode funfacts');

    const mergedStates = statesData.map(state => {
        const matchingMongoDBState = stateFunFacts.find(s => s.stateCode === state.code);
        return { ...state, funfacts: matchingMongoDBState ? matchingMongoDBState.funfacts : [] };
    });

    res.json(mergedStates);

});

// Get state by state code
router.get('/:state', async (req, res) => {
    const stateCode = req.params.state.toUpperCase();

    const stateFunFact = await States.findOne({ stateCode }, 'funfacts');

    const state = statesData.find(s => s.code === stateCode);
    const mergedState = { ...state, funfacts: stateFunFact ? stateFunFact.funfacts : [] };
    if (!state) {
        return res.status(404).json({ message: "Invalid state abbreviation parameter" })
    }
    if (mergedState) {
        if (stateFunFact) {
            return res.json(mergedState);
        }
        return res.json({ ...state });
    } else {
        res.status(404).json({ message: 'State not found' });
    }
});
//   Random funfact
router.get('/:state/funfact', async (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const stateFunFacts = await States.findOne({ stateCode }, 'funfacts');
    const state = statesData.find(s => s.code === stateCode);

    if (stateFunFacts && stateFunFacts.funfacts.length > 0) {
        const randomIndex = Math.floor(Math.random() * stateFunFacts.funfacts.length);
        res.json({ funfact: stateFunFacts.funfacts[randomIndex] });
    } else {
        if (state) {
            return res.status(404).json({ message: "No Fun Facts found for " + state.state });
        }
        return res.status(404).json({ message: 'Invalid state abbreviation parameter' });

    }
});
//   Get state capital
router.get('/:state/capital', async (req, res) => {
    const stateCode = req.params.state.toUpperCase();

    const state = statesData.find(s => s.code === stateCode);

    if (state) {
        res.json({ state: state.state, capital: state.capital_city });
    } else {
        res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    }
});
// get state nickname
router.get('/:state/nickname', async (req, res) => {
    const stateCode = req.params.state.toUpperCase();

    const state = statesData.find(s => s.code === stateCode);

    if (state) {
        res.json({ state: state.state, nickname: state.nickname });
    } else {
        res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    }
});

// Get state population
router.get('/:state/population', async (req, res) => {
    const stateCode = req.params.state.toUpperCase();

    const state = statesData.find(s => s.code === stateCode);

    if (state) {
        res.json({ state: state.state, population: state.population.toLocaleString() });
    } else {
        res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    }
});

//   Get state adm date
router.get('/:state/admission', async (req, res) => {
    const stateCode = req.params.state.toUpperCase();

    const state = statesData.find(s => s.code === stateCode);

    if (state) {
        res.json({ state: state.state, admitted: state.admission_date });
    } else {
        res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    }
});

//   add funfact on state
router.post('/:state/funfact', async (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const { funfacts } = req.body;
    
    if (!funfacts) {
        res.status(400).json({ message: 'State fun facts value required' });
        return;
    }
    if (!Array.isArray(funfacts)) {
        res.status(400).json({ message: 'State fun facts value must be an array' });
        return;
    }
    const stateCod = await States.findOne({ stateCode });
    const state = statesData.find(s => s.code === stateCode);


    if (stateCod) {
        stateCod.funfacts = stateCod.funfacts.concat(funfacts);
         await stateCod.save();
        res.status(201).json({state: state.state, message:"success", stateCode, funfacts: stateCod.funfacts });
    } else {
        const newState = new States({ stateCode, funfacts, stateName: statesData.find(s => s.code === stateCode).state });
        await newState.save();
        res.status(201).json({...newState, message:"success", state:state.state});
        // res.status(201).json({ stateCode, funfacts: newState.funfacts });
    }
});
//   replace funfact on state
router.patch('/:state/funfact', async (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const { index, funfact } = req.body;
    if (!index) {
        res.status(400).json({ message: 'State fun fact index value required' });
        return;
    }
    if (!funfact || typeof funfact !== 'string') {
        res.status(400).json({ message: 'State fun fact value required' });
        return;
    }
 

    const stateFunfact = await States.findOne({ stateCode });
    const state = statesData.find(s => s.code === stateCode);

    if (stateFunfact) {
        if (index > 0 && index <= stateFunfact.funfacts.length) {
            stateFunfact.funfacts[index - 1] = funfact;
            await stateFunfact.save();
            res.json({ state: state.state, message:"success", stateCode, funfacts: stateFunfact.funfacts });
        } else {
            res.status(400).json({ message: 'No Fun Fact found at that index for ' + state.state });
        }
    } else {
        if (state) {
            res.status(404).json({ message: 'No Fun Facts found for ' + state.state });
            return;
        }
        res.status(404).json({ message: 'Invalid state abbreviation parameter'});

    }
});
//   Delete funfact from state
router.delete('/:state/funfact', async (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const { index } = req.body;

    if (!index ) {
        res.status(400).json({ message: 'State fun fact index value required' });
        return;
    }

    const stateFunfact = await States.findOne({ stateCode });
    const state = statesData.find(s => s.code === stateCode);


    if (stateFunfact) {
        if (index > 0 && index <= stateFunfact.funfacts.length) {
            stateFunfact.funfacts.splice(index - 1, 1);
            await stateFunfact.save();
            res.status(202).json({ state:state.state, message:"success",stateCode, funfacts: stateFunfact.funfacts });
        } else {
            res.status(404).json({ message: 'No Fun Fact found at that index for '+ state.state });
        }
    } else {
        if (state) {
            res.status(400).json({ message: 'No Fun Facts found for '+state.state });
            return;
        }
        res.status(404).json({ message: 'Invalid state abbreviation parameter' });
        return;
    }
});

module.exports = router;