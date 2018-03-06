const path = require('path');
const solc = require('solc');
const fs = require('fs-extra');

const buildPath = path.resolve(__dirname, 'build');
fs.removeSync(buildPath);

const trustPath = path.resolve(__dirname, 'contracts', 'Trust.sol');
const trustSource = fs.readFileSync(trustPath, 'utf8');

const anyTeBPath = path.resolve(__dirname, 'contracts', 'AnyTrusteeEqualBen.sol');
const anyTeBSource = fs.readFileSync(anyTeBPath, 'utf8');

const majorityTeBPath = path.resolve(__dirname, 'contracts', 'MajorityTrusteeEqualBen.sol');
const majorityTeBSource = fs.readFileSync(majorityTeBPath, 'utf8');

const allTeBPath = path.resolve(__dirname, 'contracts', 'AllTrusteeEqualBen.sol');
const allTeBSource = fs.readFileSync(allTeBPath, 'utf8');

const source = trustSource + " " + anyTeBSource + " " + majorityTeBSource + " " + allTeBSource;
//
// fs.writeFile('source.sol', source, (err) => {
//     // throws an error, you could also catch it here
//     if (err) throw err;
//     console.log('Combined source written to source.sol');
// });

const compOutput = solc.compile (source, 4);
//console.log (compOutput);

const output = compOutput.contracts;

fs.ensureDirSync(buildPath);

for (let contract in output) {
  fs.outputJsonSync(
    path.resolve(buildPath, contract.replace(':', '') + '.json'),
    output[contract]
  );
}
