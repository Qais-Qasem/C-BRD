import fs from 'fs';

let code = fs.readFileSync('src/components/ModuleStudyWorkspace.tsx', 'utf8');

const loadModuleStudyDataRegex = /(const topRes = await fetch\(\`\/api\/module-study\/topics\/\$\{currentProjectId\}\/\$\{currentModuleId\}\`\);[\s\S]*?if \(sel\) setSelectedTopicId\(sel\.id\);\n\s*\})/m;

const loadModuleStudyDataReplacement = `const topRes = await fetch(\`/api/module-study/topics/\${currentProjectId}/\${currentModuleId}\`);
      const topData = await topRes.json();
      
      let fetchedTopics = topData.topics || [];
      
      // If we have a map, but topics are empty or unavailable, try to generate them
      if ((!topData.success || fetchedTopics.length === 0) && reqData?.requirementsMap) {
         try {
             const headers = await getAuthHeaders();
             const genRes = await fetch('/api/module-study/generate-topics', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json', ...headers },
                 body: JSON.stringify({
                     projectId: currentProjectId,
                     moduleId: currentModuleId,
                     requirementsMapId: reqData.requirementsMap.id
                 })
             });
             const genData = await genRes.json();
             if (genData.success && genData.topics) {
                 fetchedTopics = genData.topics;
             }
         } catch (e) {
             console.warn('Could not generate topics:', e);
         }
      }

      if (fetchedTopics.length > 0) {
        setTopics(fetchedTopics);
        const sel = fetchedTopics.find((t: any) => t.id === targetTopicId || t.isSelected) || fetchedTopics[0];
        if (sel) setSelectedTopicId(sel.id);
      } else {
        setTopics([]);
        setSelectedTopicId('');
      }`;

code = code.replace(loadModuleStudyDataRegex, loadModuleStudyDataReplacement);

// State clearing on module switch
const useEffectRegex = /useEffect\(\(\) => \{\n\s*loadModuleStudyData\(\);\n\s*\}, \[currentProjectId, currentModuleId\]\);/;
const useEffectReplacement = `useEffect(() => {
    // Clear state when switching modules to prevent stale UI
    setRequirementsMap(null);
    setTopics([]);
    setSelectedTopicId('');
    setCaseSetup(null);
    setCaseTeam(null);
    
    // Using an abort controller could be added here for strict race protection,
    // but clearing the states ensures the previous module's data doesn't persist.
    loadModuleStudyData();
  }, [currentProjectId, currentModuleId]);`;

code = code.replace(useEffectRegex, useEffectReplacement);

// Cross-module selection gate
// In handleSelectTopic:
const handleSelectTopicRegex = /const handleSelectTopic = \(topicId: string\) => \{\n\s*setSelectedTopicId\(topicId\);\n\s*setTopics\(prev => prev.map\(t => \(\{ \.\.\.t, isSelected: t\.id === topicId \}\)\)\);\n\s*showNotification\(\`Selected topic: \$\{topics.find\(t => t\.id === topicId\)\?\.topicName\}\`, 'info'\);\n\s*\};/;
const handleSelectTopicReplacement = `const handleSelectTopic = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    if (topic && topic.relevanceCategory === 'CROSS_MODULE_REFERENCE') {
        showNotification('Cross-module references cannot be selected as primary consulting topics.', 'error');
        return;
    }
    setSelectedTopicId(topicId);
    setTopics(prev => prev.map(t => ({ ...t, isSelected: t.id === topicId })));
    showNotification(\`Selected topic: \${topics.find(t => t.id === topicId)?.topicName}\`, 'info');
  };`;

code = code.replace(handleSelectTopicRegex, handleSelectTopicReplacement);

fs.writeFileSync('src/components/ModuleStudyWorkspace.tsx', code);
