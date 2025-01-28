import React, { useEffect, useState } from 'react';
import ForgeReconciler, { BarChart, Box, Heading, Inline, Label, Link, SectionMessage, Select, SingleValueChart, Stack, Text, useProductContext, xcss } from '@forge/react';
import { invoke } from '@forge/bridge';
import { PERIOD_A, PERIOD_B, WORK_DAY, MONTH_PICKER } from './data';

const BottomPaddedBox = ({ children }) => (
  <Box paddingBlockEnd="space.400">{children}</Box>
);

const leftNavStyle = xcss({
  width: '20%',
  padding: 'space.100',
  maxWidth: '300px',
  backgroundColor: 'color.background.neutral',
  height: '100%',
});


const LeftNavBox = ({ children }) => (
  <Box xcss={leftNavStyle} paddingInlineStart="space.400">{children}</Box>
);

const MainBox = ({ children }) => (
  <Box xcss={{ width: '80%', height: '100%'}} paddingInlineEnd="space.400">{children}</Box>
);

const groupUserData = (d) => {
  let groupedUserData = [];
  if(d){
    d.forEach((user, index) => {
      console.log(user)
      let groupA = [];
      let groupB = [];
      let groupC = [];
      user.issues.forEach(issue => {
        let elapsed = Number(issue.fields.customfield_10030.completedCycles[0].elapsedTime.millis)
        if (elapsed < PERIOD_A*WORK_DAY) {
          groupA.push(issue);
        } else if (elapsed < PERIOD_B*WORK_DAY) {
          groupB.push(issue);
        } else {
          groupC.push(issue);
        }
      })
      groupedUserData.push(['under ' + PERIOD_A + ' days', groupA.length, user.displayName])
      groupedUserData.push([PERIOD_A + '-' + PERIOD_B + ' days', groupB.length, user.displayName])
      groupedUserData.push(['over ' + PERIOD_B + ' days', groupC.length, user.displayName])
    })
  }
  return groupedUserData;
}

const getGroupData = (d) => {
  let issueData = {
    Resolved: {
      groupA: [],
      groupB: [],
      groupC: []
    },
    Unresolved: {
      groupA: [],
      groupB: [],
      groupC: []
    },
    ResolvedByUser: [{
      accountId: null,
      displayName: "Unassigned",
      issues: []
    }]
  }
  if(d){
    d.issues.forEach(issue => {
      let elapsed = null;
      if (issue.fields.resolutiondate !== null) {
        elapsed = Number(issue.fields.customfield_10030.completedCycles[0].elapsedTime.millis)        
        if(issue.fields.assignee !== null) {
          let index = issueData.ResolvedByUser.findIndex(x => x.accountId === issue.fields.assignee.accountId)
          if(index === -1) {
            issueData.ResolvedByUser.push({
              accountId: issue.fields.assignee.accountId,
              displayName: issue.fields.assignee.displayName,
              issues: [issue]
            })
          } else {
            issueData.ResolvedByUser[index].issues.push(issue)
          }  
        } else {
          issueData.ResolvedByUser[0].issues.push(issue)
        }
        
        if (elapsed < PERIOD_A*WORK_DAY) {
          issueData.Resolved.groupA.push(issue);
        } else if (elapsed < PERIOD_B*WORK_DAY) {
          issueData.Resolved.groupB.push(issue);
        } else {
          issueData.Resolved.groupC.push(issue);
        }
      }
      else {
        elapsed = Number(issue.fields.customfield_10030.ongoingCycle.elapsedTime.millis)
        if (elapsed < PERIOD_A*WORK_DAY) {
          issueData.Unresolved.groupA.push(issue);
        } else if (elapsed < PERIOD_B*WORK_DAY) {
          issueData.Unresolved.groupB.push(issue);
        } else {
          issueData.Unresolved.groupC.push(issue);
        }
      }
  })
  return issueData  
  }
}

const App = () => {  
  const [groupData, setGroupData] = useState(null);
  const [issues, setIssues] = useState(null);
  const [reportingPeriod, setReportingPeriod] = useState(null);
  const [userData, setUserData] = useState(null);

  const context = useProductContext();
  if(context) {
    console.log(context.extension.project.key)
  }

  const setMonth = (input) => {
    setReportingPeriod(input.value)
  }

  useEffect(() => {
    if(reportingPeriod) {
      const first = new Date(reportingPeriod.split("-")[0], reportingPeriod.split("-")[1], 1)
      const last = new Date(reportingPeriod.split("-")[0], Number(reportingPeriod.split("-")[1]) + 1, 0)
      invoke('getIssues', { start: first, end: last }).then(setIssues);
    }
  }, [reportingPeriod]);

  useEffect(() => {
    setGroupData(getGroupData(issues))
  }, [issues]);

  useEffect(() => {
    if(groupData){
      setUserData(groupUserData(groupData.ResolvedByUser))
    }
  }, [groupData]);


  function userReport() {
    return (
      <>
        <BottomPaddedBox>
        {userData && <BarChart
          title="Resolved issues by assignee, age in buisness days"
          subtitle="Count of resolved issues, by age in buisness days"
          data={userData}
          xAccessor={0}
          yAccessor={1}
          colorAccessor={2}
        />}
      </BottomPaddedBox>
      </>
    )
  }
  function atlassianComponentsReport() {
    return (
      <>
      <BottomPaddedBox>
        <Heading as="h2">Resolved issues</Heading>
        <Heading as="h4">Resolution time in buisness days</Heading>
        <SectionMessage appearance="information">
          <Text>
            The <Link href="https://developer.atlassian.com/platform/forge/ui-kit/components/single-value-chart/">Chart - Single Value</Link> isn't rendering properly at this time. 
          </Text>
        </SectionMessage>
          <Inline space="space.400" spread="space-between">
            <SingleValueChart
              data={groupData.Resolved.groupA.length}
              label={"Issues resolved in less than " + PERIOD_A + " days"}
            />
            <SingleValueChart
              data={groupData.Resolved.groupB.length}
              label={"Issues resolved in less than " + PERIOD_B + " days"}
            />
            <SingleValueChart
              data={groupData.Resolved.groupC.length}
              label={"Issues resolved in " + PERIOD_B + " days or more"}
            />
          </Inline>
      </BottomPaddedBox>

      <BottomPaddedBox>
          <BarChart 
            title="Unresolved Issues"
            subtitle="Count of unresolved issues, by age in buisness days"
            data={[
              ['Under ' + PERIOD_A + ' days', groupData.Unresolved.groupA.length],
              [PERIOD_A + ' - ' + PERIOD_B + ' days', groupData.Unresolved.groupB.length],
              [PERIOD_B + ' or more days', groupData.Unresolved.groupC.length],
            ]}
            xAccessor={0}
            yAccessor={1} 
          />
      </BottomPaddedBox>
      </>
    )
  }


  return (
    <>
        <BottomPaddedBox>
          <Heading as="h1">Resolution time report</Heading>
          <Heading as="h3">Project: {context ? context.extension.project.key : 'Loading...'}</Heading>
        </BottomPaddedBox>
        <BottomPaddedBox>
          <Label labelFor="month-picker">Select reporting period</Label>
          <Select 
            onChange={setMonth}
            id="month-picker" 
            options={MONTH_PICKER} 
            placeholder="select a month"/>
        </BottomPaddedBox>
        {groupData && 
          <Inline space="space.400" spread="space-between" alignBlock="stretch">
            <LeftNavBox><Text>Left Nav goes here</Text></LeftNavBox>
            <MainBox>{atlassianComponentsReport()}</MainBox>
          </Inline>}
    </>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

