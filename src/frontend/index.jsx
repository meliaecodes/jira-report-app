import React, { useEffect, useState } from 'react';
import ForgeReconciler, { BarChart, Box, Button, Frame, Heading, Inline, Label, PieChart, Select, Stack, useProductContext, xcss } from '@forge/react';
import { invoke } from '@forge/bridge';
import { PERIOD_A, PERIOD_B, WORK_DAY, MONTH_PICKER } from './data';

const BottomPaddedBox = ({ children }) => (
  <Box paddingBlockEnd="space.400">{children}</Box>
);

const LeftNavBox = ({ children }) => (
  <Box xcss={{ width: '20%', height: '100%', maxWidth: '300px', padding : 'space.100'}} paddingInlineStart="space.400">{children}</Box>
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
  const [showUIKit, setShowUIKit] = useState(true);

  const context = useProductContext();


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

  function atlassianComponentsReport() {
    return (
      <>
      <BottomPaddedBox>
        <Inline spread='space-between'>
          <PieChart
              title="Resolved Issues"
              subtitle="Count of resolved issues, by age in buisness days"
              data={[
                ['group_a', 'Under ' + PERIOD_A + ' days', groupData.Resolved.groupA.length],
                ['group_b',PERIOD_A + ' - ' + PERIOD_B + ' days', groupData.Resolved.groupB.length],
                ['group_c', 'over ' + PERIOD_B + ' or more days', groupData.Resolved.groupC.length],
              ]}
            colorAccessor={0} // position 0 in item array
            labelAccessor={1} // position 1 in item array
            valueAccessor={2} // position 2 in item array
          /> 
          <BarChart 
            title="Unresolved Issues"
            subtitle="Count of unresolved issues, by age in buisness days"
            width='600px'
            data={[
              ['Under ' + PERIOD_A + ' days', groupData.Unresolved.groupA.length],
              [PERIOD_A + ' - ' + PERIOD_B + ' days', groupData.Unresolved.groupB.length],
              [PERIOD_B + ' or more days', groupData.Unresolved.groupC.length],
            ]}
            xAccessor={0}
            yAccessor={1} 
          />
      </Inline>
      </BottomPaddedBox>

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
            <LeftNavBox>
              <Stack space="space.100" grow='hug' alignInline='start' spread='space-between'>
                <Heading as="h3">Select report</Heading>
                <Button spacing="compact" appearance='subtle' onClick={() => setShowUIKit(true)}>UI Kit Components</Button>
                <Button spacing="compact"appearance='subtle' onClick={() => setShowUIKit(false)}>Frame Components</Button>
              </Stack>
            </LeftNavBox>
            <MainBox>
              <Stack>
                {showUIKit && atlassianComponentsReport()}
                {!showUIKit && <Frame resource='frame-report' />}
              </Stack>
            </MainBox>
          </Inline>}
    </>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

