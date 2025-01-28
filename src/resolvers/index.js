import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';



const jiraDate = (d) => {
  const date = new Date(d)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const getResolvedIssues = async(key, start, end) => {
  const fields = 'created, creator, assignee, resolutiondate, customfield_10030';
  const jql = `project = ${key} AND created >= ${jiraDate(start)} AND created <= ${jiraDate(end)} AND resolved NOT IN (EMPTY)`;
  const response = await api.asUser().requestJira(route`/rest/api/3/search/jql?jql=${jql}&fields=${fields}`, {
    headers: {
      'Accept': 'application/json'
    }
  });

  if(response.status === 200) {
    let data = await response.json();
    return(data);
  } else 
  {  
    console.log("Response:")
    console.log(response)
    return(response)
  }
}

const getIssues = async(key, start, end) => {
  const fields = 'created, creator, assignee, resolutiondate, customfield_10030';
  const jql = `project = ${key} AND created >= ${jiraDate(start)} AND created <= ${jiraDate(end)}`;
  const response = await api.asUser().requestJira(route`/rest/api/3/search/jql?jql=${jql}&fields=${fields}`, {
    headers: {
      'Accept': 'application/json'
    }
  });

  if(response.status === 200) {
    let data = await response.json();
    return(data);
  } else 
  {  
    console.log("Response:")
    console.log(response)
    return(response)
  }
}

const resolver = new Resolver();

resolver.define('getText', (req) => {
  console.log(req);
  return 'Hello, world!';
});

resolver.define('getIssues', async (req) => {
  const data = await getIssues(req.context.extension.project.key, req.payload.start, req.payload.end);
  return data;

});


export const handler = resolver.getDefinitions();
