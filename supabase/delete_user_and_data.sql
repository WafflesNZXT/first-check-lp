-- Delete user and all their data (audits, etc)
create or replace function delete_user_and_data()
returns void language plpgsql as $$
begin
  delete from audits where user_id = auth.uid();
  delete from users where id = auth.uid();
  perform auth.signout();
end;
$$;
