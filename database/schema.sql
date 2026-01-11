-- Create epics table
CREATE TABLE IF NOT EXISTS epics (
    id SERIAL PRIMARY KEY,
    issue_key VARCHAR(50) UNIQUE NOT NULL,
    issue_id VARCHAR(50) UNIQUE NOT NULL,
    summary VARCHAR(500) NOT NULL,
    issue_type VARCHAR(50) DEFAULT 'Epic',
    status VARCHAR(50) NOT NULL,
    status_category VARCHAR(50),
    priority VARCHAR(50),
    resolution VARCHAR(50),
    
    -- Project information
    project_key VARCHAR(50) NOT NULL,
    project_name VARCHAR(255),
    project_type VARCHAR(50),
    project_lead VARCHAR(255),
    project_lead_id VARCHAR(100),
    
    -- People
    assignee VARCHAR(255),
    assignee_id VARCHAR(100),
    reporter VARCHAR(255),
    reporter_id VARCHAR(100),
    creator VARCHAR(255),
    creator_id VARCHAR(100),
    
    -- Dates
    created TIMESTAMP NOT NULL,
    updated TIMESTAMP NOT NULL,
    last_viewed TIMESTAMP,
    resolved TIMESTAMP,
    due_date TIMESTAMP,
    
    -- Epic-specific fields
    epic_name VARCHAR(255),
    epic_status VARCHAR(50),
    epic_color VARCHAR(50),
    
    -- Estimates and time tracking
    original_estimate INTEGER,
    remaining_estimate INTEGER,
    time_spent INTEGER,
    work_ratio DECIMAL(10, 2),
    story_points DECIMAL(10, 2),
    story_points_original DECIMAL(10, 2),
    story_points_remaining DECIMAL(10, 2),
    story_points_rough DECIMAL(10, 2),
    
    -- Additional metadata
    description TEXT,
    environment TEXT,
    fix_versions VARCHAR(500),
    components VARCHAR(500),
    labels VARCHAR(500),
    votes INTEGER DEFAULT 0,
    
    -- Team and organization
    team VARCHAR(255),
    team_development VARCHAR(255),
    product_owner VARCHAR(255),
    
    -- Custom fields
    category VARCHAR(255),
    complexity VARCHAR(255),
    commitment VARCHAR(255),
    customer VARCHAR(255),
    request_origin VARCHAR(255),
    request_type VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_epics_project_key ON epics(project_key);
CREATE INDEX IF NOT EXISTS idx_epics_status ON epics(status);
CREATE INDEX IF NOT EXISTS idx_epics_assignee_id ON epics(assignee_id);
CREATE INDEX IF NOT EXISTS idx_epics_team ON epics(team);
CREATE INDEX IF NOT EXISTS idx_epics_created ON epics(created);
CREATE INDEX IF NOT EXISTS idx_epics_due_date ON epics(due_date);

-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
    id SERIAL PRIMARY KEY,
    issue_key VARCHAR(50) UNIQUE NOT NULL,
    issue_id VARCHAR(50) UNIQUE NOT NULL,
    summary VARCHAR(500) NOT NULL,
    issue_type VARCHAR(50) DEFAULT 'Story',
    status VARCHAR(50) NOT NULL,
    status_category VARCHAR(50),
    priority VARCHAR(50),
    resolution VARCHAR(50),
    
    -- Project information
    project_key VARCHAR(50) NOT NULL,
    project_name VARCHAR(255),
    project_type VARCHAR(50),
    project_lead VARCHAR(255),
    project_lead_id VARCHAR(100),
    
    -- People
    assignee VARCHAR(255),
    assignee_id VARCHAR(100),
    reporter VARCHAR(255),
    reporter_id VARCHAR(100),
    creator VARCHAR(255),
    creator_id VARCHAR(100),
    resolved_by VARCHAR(255),
    resolved_by_id VARCHAR(100),
    
    -- Dates
    created TIMESTAMP NOT NULL,
    updated TIMESTAMP NOT NULL,
    last_viewed TIMESTAMP,
    resolved TIMESTAMP,
    due_date TIMESTAMP,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    planned_start TIMESTAMP,
    planned_end TIMESTAMP,
    target_start TIMESTAMP,
    target_end TIMESTAMP,
    
    -- Parent/Epic relationship
    parent_id VARCHAR(50),
    parent_key VARCHAR(50),
    parent_summary VARCHAR(500),
    
    -- Epic information (from custom fields)
    epic_name VARCHAR(255),
    epic_status VARCHAR(50),
    epic_color VARCHAR(50),
    
    -- Sprint information (multiple sprints stored as array)
    sprints TEXT[],
    
    -- Estimates and time tracking
    original_estimate INTEGER,
    remaining_estimate INTEGER,
    time_spent INTEGER,
    work_ratio DECIMAL(10, 2),
    total_original_estimate INTEGER,
    total_remaining_estimate INTEGER,
    total_time_spent INTEGER,
    
    -- Story points
    story_points DECIMAL(10, 2),
    story_points_original DECIMAL(10, 2),
    story_points_remaining DECIMAL(10, 2),
    story_points_rough DECIMAL(10, 2),
    story_points_magic DECIMAL(10, 2),
    
    -- Additional metadata
    description TEXT,
    environment TEXT,
    components VARCHAR(500),
    labels VARCHAR(500),
    votes INTEGER DEFAULT 0,
    security_level VARCHAR(50),
    
    -- Attachments and links
    attachments VARCHAR(1000),
    inward_links VARCHAR(500),
    outward_links VARCHAR(500),
    
    -- Team and organization
    team VARCHAR(255),
    team_development VARCHAR(255),
    product_owner VARCHAR(255),
    
    -- Custom fields (commonly used)
    category VARCHAR(255),
    complexity VARCHAR(255),
    commitment VARCHAR(255),
    customer VARCHAR(255),
    request_origin VARCHAR(255),
    request_type VARCHAR(255),
    issue_origin VARCHAR(255),
    work_category VARCHAR(255),
    
    -- Checklist and progress
    checklist_completed VARCHAR(50),
    checklist_progress VARCHAR(100),
    checklist_progress_percent DECIMAL(5, 2),
    checklist_text TEXT,
    
    -- Development and testing
    test_automation_required VARCHAR(50),
    test_cases VARCHAR(500),
    test_plan VARCHAR(500),
    
    -- Dates from custom fields
    date_approval_done TIMESTAMP,
    date_concept_done TIMESTAMP,
    date_development_done TIMESTAMP,
    date_test_done TIMESTAMP,
    date_go_live TIMESTAMP,
    
    -- Comments (stored as JSON or text)
    comments TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stories_project_key ON stories(project_key);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_assignee_id ON stories(assignee_id);
CREATE INDEX IF NOT EXISTS idx_stories_team ON stories(team);
CREATE INDEX IF NOT EXISTS idx_stories_parent_key ON stories(parent_key);
CREATE INDEX IF NOT EXISTS idx_stories_created ON stories(created);
CREATE INDEX IF NOT EXISTS idx_stories_due_date ON stories(due_date);
CREATE INDEX IF NOT EXISTS idx_stories_epic_name ON stories(epic_name);

-- Create bugs_new_dev table
CREATE TABLE IF NOT EXISTS bugs_new_dev (
    id SERIAL PRIMARY KEY,
    issue_key VARCHAR(50) UNIQUE NOT NULL,
    issue_id VARCHAR(50) UNIQUE NOT NULL,
    summary VARCHAR(500) NOT NULL,
    issue_type VARCHAR(100) DEFAULT 'Bug (new development)',
    status VARCHAR(50) NOT NULL,
    status_category VARCHAR(50),
    priority VARCHAR(50),
    resolution VARCHAR(50),
    
    -- Project information
    project_key VARCHAR(50) NOT NULL,
    project_name VARCHAR(255),
    project_type VARCHAR(50),
    project_lead VARCHAR(255),
    project_lead_id VARCHAR(100),
    
    -- People
    assignee VARCHAR(255),
    assignee_id VARCHAR(100),
    reporter VARCHAR(255),
    reporter_id VARCHAR(100),
    creator VARCHAR(255),
    creator_id VARCHAR(100),
    resolved_by VARCHAR(255),
    resolved_by_id VARCHAR(100),
    
    -- Dates
    created TIMESTAMP NOT NULL,
    updated TIMESTAMP NOT NULL,
    last_viewed TIMESTAMP,
    resolved TIMESTAMP,
    due_date TIMESTAMP,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    planned_start TIMESTAMP,
    planned_end TIMESTAMP,
    target_start TIMESTAMP,
    target_end TIMESTAMP,
    
    -- Parent/Epic relationship
    parent_id VARCHAR(50),
    parent_key VARCHAR(50),
    parent_summary VARCHAR(500),
    
    -- Epic information (from custom fields)
    epic_name VARCHAR(255),
    epic_status VARCHAR(50),
    epic_color VARCHAR(50),
    
    -- Sprint information (multiple sprints stored as comma-separated)
    sprints VARCHAR(500),
    
    -- Estimates and time tracking
    original_estimate INTEGER,
    remaining_estimate INTEGER,
    time_spent INTEGER,
    work_ratio DECIMAL(10, 2),
    total_original_estimate INTEGER,
    total_remaining_estimate INTEGER,
    total_time_spent INTEGER,
    
    -- Story points
    story_points DECIMAL(10, 2),
    story_points_original DECIMAL(10, 2),
    story_points_remaining DECIMAL(10, 2),
    story_points_rough DECIMAL(10, 2),
    story_points_magic DECIMAL(10, 2),
    
    -- Additional metadata
    description TEXT,
    environment TEXT,
    components VARCHAR(500),
    labels VARCHAR(500),
    votes INTEGER DEFAULT 0,
    security_level VARCHAR(50),
    
    -- Attachments and links
    attachments VARCHAR(1000),
    
    -- Team and organization
    team VARCHAR(255),
    team_development VARCHAR(255),
    product_owner VARCHAR(255),
    
    -- Custom fields (commonly used)
    category VARCHAR(255),
    complexity VARCHAR(255),
    commitment VARCHAR(255),
    customer VARCHAR(255),
    request_origin VARCHAR(255),
    request_type VARCHAR(255),
    issue_origin VARCHAR(255),
    work_category VARCHAR(255),
    
    -- Checklist and progress
    checklist_completed VARCHAR(50),
    checklist_progress VARCHAR(100),
    checklist_progress_percent DECIMAL(5, 2),
    checklist_text TEXT,
    
    -- Development and testing
    test_automation_required VARCHAR(50),
    test_cases VARCHAR(500),
    test_plan VARCHAR(500),
    
    -- Bug-specific fields
    affected_artifacts VARCHAR(500),
    affected_hardware VARCHAR(500),
    affected_services VARCHAR(500),
    incident_id VARCHAR(100),
    incident_active VARCHAR(50),
    major_incident VARCHAR(50),
    vulnerability VARCHAR(255),
    
    -- Dates from custom fields
    date_approval_done TIMESTAMP,
    date_concept_done TIMESTAMP,
    date_development_done TIMESTAMP,
    date_test_done TIMESTAMP,
    date_go_live TIMESTAMP,
    date_approval_production_env TIMESTAMP,
    date_approval_staging_env TIMESTAMP,
    date_approval_test_env TIMESTAMP,
    
    -- SLA and response times
    sla_start_date TIMESTAMP,
    sla_target_date TIMESTAMP,
    time_to_first_response VARCHAR(100),
    time_to_resolution VARCHAR(100),
    date_of_first_response TIMESTAMP,
    time_in_status VARCHAR(100),
    
    -- Satisfaction and quality
    satisfaction_rating VARCHAR(50),
    satisfaction_date TIMESTAMP,
    sentiment VARCHAR(50),
    solution_approach TEXT,
    solution_proposal TEXT,
    solution_quality VARCHAR(50),
    
    -- Comments (stored as JSON or text)
    comments TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bugs_new_dev_project_key ON bugs_new_dev(project_key);
CREATE INDEX IF NOT EXISTS idx_bugs_new_dev_status ON bugs_new_dev(status);
CREATE INDEX IF NOT EXISTS idx_bugs_new_dev_assignee_id ON bugs_new_dev(assignee_id);
CREATE INDEX IF NOT EXISTS idx_bugs_new_dev_team ON bugs_new_dev(team);
CREATE INDEX IF NOT EXISTS idx_bugs_new_dev_parent_key ON bugs_new_dev(parent_key);
CREATE INDEX IF NOT EXISTS idx_bugs_new_dev_created ON bugs_new_dev(created);
CREATE INDEX IF NOT EXISTS idx_bugs_new_dev_due_date ON bugs_new_dev(due_date);
CREATE INDEX IF NOT EXISTS idx_bugs_new_dev_epic_name ON bugs_new_dev(epic_name);
CREATE INDEX IF NOT EXISTS idx_bugs_new_dev_resolution ON bugs_new_dev(resolution);

-- Create subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
    id SERIAL PRIMARY KEY,
    issue_key VARCHAR(50) UNIQUE NOT NULL,
    issue_id VARCHAR(50) UNIQUE NOT NULL,
    summary VARCHAR(500) NOT NULL,
    issue_type VARCHAR(50) DEFAULT 'Sub-Task',
    status VARCHAR(50) NOT NULL,
    status_category VARCHAR(50),
    priority VARCHAR(50),
    resolution VARCHAR(50),
    
    -- Project information
    project_key VARCHAR(50) NOT NULL,
    project_name VARCHAR(255),
    project_type VARCHAR(50),
    project_lead VARCHAR(255),
    project_lead_id VARCHAR(100),
    
    -- People
    assignee VARCHAR(255),
    assignee_id VARCHAR(100),
    reporter VARCHAR(255),
    reporter_id VARCHAR(100),
    creator VARCHAR(255),
    creator_id VARCHAR(100),
    resolved_by VARCHAR(255),
    resolved_by_id VARCHAR(100),
    
    -- Dates
    created TIMESTAMP NOT NULL,
    updated TIMESTAMP NOT NULL,
    last_viewed TIMESTAMP,
    resolved TIMESTAMP,
    due_date TIMESTAMP,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    planned_start TIMESTAMP,
    planned_end TIMESTAMP,
    target_start TIMESTAMP,
    target_end TIMESTAMP,
    
    -- Parent relationship (links to Story, Bug, or Epic)
    parent_id VARCHAR(50),
    parent_key VARCHAR(50),
    parent_summary VARCHAR(500),
    
    -- Epic information (from custom fields)
    epic_name VARCHAR(255),
    epic_status VARCHAR(50),
    epic_color VARCHAR(50),
    
    -- Sprint information (multiple sprints stored as comma-separated)
    sprints VARCHAR(500),
    
    -- Estimates and time tracking
    original_estimate INTEGER,
    remaining_estimate INTEGER,
    time_spent INTEGER,
    work_ratio DECIMAL(10, 2),
    total_original_estimate INTEGER,
    total_remaining_estimate INTEGER,
    total_time_spent INTEGER,
    
    -- Story points
    story_points DECIMAL(10, 2),
    story_points_original DECIMAL(10, 2),
    story_points_remaining DECIMAL(10, 2),
    story_points_rough DECIMAL(10, 2),
    story_points_magic DECIMAL(10, 2),
    
    -- Additional metadata
    description TEXT,
    environment TEXT,
    components VARCHAR(500),
    labels VARCHAR(500),
    votes INTEGER DEFAULT 0,
    security_level VARCHAR(50),
    watchers VARCHAR(500),
    watchers_id VARCHAR(500),
    
    -- Attachments and links
    attachments VARCHAR(1000),
    inward_links_cloners VARCHAR(500),
    outward_links_cloners VARCHAR(500),
    inward_links_relates VARCHAR(500),
    
    -- Team and organization
    team VARCHAR(255),
    team_development VARCHAR(255),
    product_owner VARCHAR(255),
    
    -- Custom fields (commonly used)
    category VARCHAR(255),
    complexity VARCHAR(255),
    commitment VARCHAR(255),
    customer VARCHAR(255),
    request_origin VARCHAR(255),
    request_type VARCHAR(255),
    issue_origin VARCHAR(255),
    work_category VARCHAR(255),
    
    -- Checklist and progress
    checklist_completed VARCHAR(50),
    checklist_progress VARCHAR(100),
    checklist_progress_percent DECIMAL(5, 2),
    checklist_text TEXT,
    
    -- Development and testing
    test_automation_required VARCHAR(50),
    test_cases VARCHAR(500),
    test_plan VARCHAR(500),
    
    -- Dates from custom fields
    date_approval_done TIMESTAMP,
    date_concept_done TIMESTAMP,
    date_development_done TIMESTAMP,
    date_test_done TIMESTAMP,
    date_go_live TIMESTAMP,
    date_approval_production_env TIMESTAMP,
    date_approval_staging_env TIMESTAMP,
    date_approval_test_env TIMESTAMP,
    
    -- SLA and response times
    sla_start_date TIMESTAMP,
    sla_target_date TIMESTAMP,
    time_to_first_response VARCHAR(100),
    time_to_resolution VARCHAR(100),
    date_of_first_response TIMESTAMP,
    time_in_status VARCHAR(100),
    
    -- Comments (stored as JSON or text)
    comments TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subtasks_project_key ON subtasks(project_key);
CREATE INDEX IF NOT EXISTS idx_subtasks_status ON subtasks(status);
CREATE INDEX IF NOT EXISTS idx_subtasks_assignee_id ON subtasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_team ON subtasks(team);
CREATE INDEX IF NOT EXISTS idx_subtasks_parent_key ON subtasks(parent_key);
CREATE INDEX IF NOT EXISTS idx_subtasks_created ON subtasks(created);
CREATE INDEX IF NOT EXISTS idx_subtasks_due_date ON subtasks(due_date);
CREATE INDEX IF NOT EXISTS idx_subtasks_epic_name ON subtasks(epic_name);
CREATE INDEX IF NOT EXISTS idx_subtasks_resolution ON subtasks(resolution);
