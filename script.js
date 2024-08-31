// This is a simple annotation extractor using BioPortal's Annotation service API.
// https://data.bioontology.org/documentation#nav_annotator - Fahim Imam
async function annotateText() 
{
    const inputText = document.getElementById('inputText').value;
    if (!inputText.trim()) 
    {
        alert("Please enter some text to annotate.");
        return;
    }

    const apiKey = '24e05796-54e0-11e0-9d7b-005056aa3316';
    const url = 'https://data.bioontology.org/annotator?apikey=' + apiKey;
    const params = {
                        text: inputText,
                        ontologies: 'UBERON, FMA, NPOKB', // you can specify specific ontologies here
                        longest_only: 'true',
                        exclude_numbers: 'true',
                        whole_word_only: 'true',
                        exclude_synonyms: 'false',
                        expand_mappings: 'false'
                    };

    try
    {
        const response = await fetch(url, 
            {
                method: 'POST',
                headers: 
                {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(params)
            });

        if (!response.ok) 
        {
            throw new Error('Network Response Was Not OK ' + response.statusText);
        }

        const annotations = await response.json();
        console.log(annotations);
        displayResults(annotations);
    } 
    catch (error) 
    {
        console.error('Error:', error);
        alert('An Error Occurred While Annotating The Text.');
    }
}

function copyToClipboard(text) 
{
    const tempInput = document.createElement('input');
    document.body.appendChild(tempInput);
    tempInput.value = text;
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    alert('Copied IRI: ' + text);
}

function resetTextArea()
{
    document.getElementById('inputText').value = '';
    document.getElementById('resultsTable').style.display = 'none';
}

function displayResults(annotations) 
{
    const resultsTable = document.getElementById('resultsTable');
    const tbody = resultsTable.querySelector('tbody');
    tbody.innerHTML = '';

    if (annotations.length === 0) 
    {
        alert('No annotations found.');
        return;
    }

    // Initialize a Set to keep track of added composite keys to make sure each row is unique.
    const addedRows = new Set();

    annotations.forEach(annotation => {
        const term = annotation.annotations[0].text || '';
        const ontologyIRI = annotation.annotatedClass['@id'] || '';
        const matchingType = annotation.annotations[0].matchType || '';

        var input = document.getElementById('inputText').value;

        const from = annotation.annotations[0].from;
        const to = annotation.annotations[0].to;

        const beforeText = input.substring(0, from - 1).split(' ');
        const afterText = input.substring(to).split(' ');
        const matchedText = input.substring(from - 1, to);

        const contextBefore = "... " + beforeText.slice(-4).join(' ');
        const contextAfter = afterText.slice(0, 4).join(' ') + " ...";

        const context = `${contextBefore ? contextBefore + ' ' : ''}<b>
                        ${matchedText}</b>${contextAfter ? ' ' + contextAfter : ''}`;

        // To create a composite key for uniqueness check
        const compositeKey = `${term}|${ontologyIRI}|${context}|${matchingType}`;

        // To check if the composite key has already been added
        if (addedRows.has(compositeKey)) 
        {
            console.log(`Row with composite key "${compositeKey}" already exists.`);
            return; // Exit if the row with this composite key is already added
        }

        // If the composite key is not in the set, add it
        addedRows.add(compositeKey);

        // Create a new table row
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${term}</td>
            <td>${context}</td>
            <td>
                <button class="copy-btn" onclick="copyToClipboard('${ontologyIRI}')">Copy URL</button>
                <a href="${ontologyIRI}" target="_blank" class="ontology-iri">${ontologyIRI}</a>

            </td>
            <td>${matchingType}</td>`;
        // Append the row to the table
        tbody.appendChild(row);
    });

    resultsTable.style.display = 'table';
}
