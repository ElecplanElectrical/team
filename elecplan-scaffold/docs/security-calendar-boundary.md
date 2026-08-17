# Calendar scheduling permission boundary

Elecplan treats job-linked calendar events as a scheduling control surface for the underlying Job.

## Admin and supervisor

- May create job-linked calendar events.
- May change linked job event time, job linkage and crew assignment.
- May delete linked job events.
- Job-linked calendar mutations continue to synchronize the Job schedule.
- Job-linked create/update/delete actions are written to the security audit trail.

## Employee

- May view assigned job-linked events.
- May not create a job-linked calendar event.
- May not reschedule, relink, reassign or delete a job-linked calendar event.
- May create and edit their own non-job events such as calls, admin or materials items.
- For their own non-job events, employees may edit title and time only; event type, job linkage and assignee are server-protected.

These rules are enforced by API routes. The calendar UI mirrors the same boundary, but server authorization is the source of truth.
