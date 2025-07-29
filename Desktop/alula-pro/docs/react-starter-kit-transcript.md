0:00
my fellow devs who are going to be
0:01
replaced with AI and to the nontechnical
0:03
people watching our demise in today's
0:05
video I'm going to be sharing with you
0:07
my brand new React starter kit now most
0:09
of you know I have an Nex.js starter kit
0:11
and that one a lot of people use a lot
0:13
of people loved don't worry that's still
0:15
there in fact I updated it you can check
0:17
it out at nextstarter.xyz but I'm going
0:20
to cover that in a different video in
0:21
today's video we're going to talk about
0:23
my React Starter kit which you can check
0:25
out at
0:26
reactstarter.xyz by the way it's
0:28
completely free you can click on star on
0:31
GitHub make sure to give it a beautiful
0:32
star on GitHub and you can download the
0:35
code completely for free yourself so
0:37
what I want to do is I want to give you
0:38
a quick demo i'm going to explain to you
0:40
the technologies I used and why I use
0:42
them and then we're going to go through
0:44
it set it up so sit back relax let's get
0:46
to building so you can go to
0:49
reactstarter.xyz and give it a quick
0:51
demo i'll click on login we used clerk
0:54
for off i'm going to click continue with
0:55
Google let's just use hopefully I didn't
0:58
use this email so I can show you what it
1:01
looks
1:02
like i have successfully logged in you
1:06
can see that it's telling me to
1:07
subscribe if I click subscribe now I'm
1:10
taken to a pricing page there's a $10 a
1:13
month subscription mind you it's Sandbox
1:15
it's fake money so I'm not going to
1:17
actually charge you but you can use this
1:19
to test this out i'm going to click get
1:21
started you see that it's setting up
1:23
checkout and it's going to redirect me
1:26
to Polar so I'm brought to the Polar
1:28
checkout you see it already pre-filled
1:30
my email let's use the test credit card
1:33
by the way if you don't know the test
1:34
credit card that Stripe or Stripe
1:36
rappers use it's 42 42 42 just 42
1:38
non-stop and then the guess you could
1:40
just put random numbers and then
1:42
province Ontario and let's click
1:44
subscribe so I'm going to be subscribing
1:46
to the $10 a month plan so the payment
1:49
successful it says welcome to your
1:50
subscription your payment was successful
1:52
let's click go to dashboard and it takes
1:55
me to the dashboard now if I go back to
1:58
convex and I click on data and I go to
2:01
users I will find yeah this user is me
2:03
Michael Shameless this is my user ID and
2:06
then if I go to subscriptions I will
2:08
find let's see current period it's 406
2:12
right now it's 407 so this is the
2:14
subscription I made right and because
2:17
I've made a subscription because I've
2:18
paid I now have access to this dashboard
2:20
this is just a dashboard for you to play
2:22
with and then I have a chat tab on the
2:25
dashboard and this one actually works i
2:27
could type
2:28
welcome and yep how can I assist you
2:31
today what is 10 times that which easy
2:36
number so I actually have a simple AI
2:39
chatbot using open AI built for you just
2:41
for you to test and then we have the
2:44
settings tab this is my subscription
2:46
status i can click on manage
2:48
subscription right and what's going to
2:50
happen it's going to take me to Polar
2:53
and this is basically like your customer
2:55
management portal and here I can change
2:57
my plan i can view my subscription i'll
3:00
just cancel my subscription it's missing
3:03
features we're going to cancel this and
3:05
you can see here it says to be cancelled
3:08
now if I go back to
3:09
subscriptions and then I look at this
3:13
field this table this is me my
3:15
subscription you see that it says it'll
3:17
be cancelled next month and then it even
3:20
shows you the reason why I cancelceled
3:22
missing features right so all of this is
3:25
literally there for you to build on top
3:28
of all for free right and I have this
3:30
like nice sleek uh landing page it's
3:33
very minimal but I kept it that way on
3:35
purpose and again all of this is right
3:37
here so now that you got a quick demo
3:40
let's go over how this all works now for
3:43
the front end we're using React Router
3:45
V7 i'll be honest with you I've been
3:46
loving React Router V7 and you know if
3:48
you guys want a video on this I'll go on
3:50
a deep dive as to why I love it and how
3:52
I use it it's just a great simple
3:55
framework overall and I've been enjoying
3:56
it now I'm using Clerk for O and lately
4:00
if you notice I've been better off build
4:01
i see the vision i love better off the
4:03
package is amazing i met the founder
4:05
great guy but the reason why I use Clerk
4:07
for this is because the better
4:09
off/convex integration is still very
4:12
much early I would say between alpha and
4:14
beta and I really wanted this to be a
4:16
production uh starter kit so you can
4:18
build your SAS and launch this and scale
4:20
this to millions of users and if you do
4:22
you know cut me cut me a check but in
4:25
order for that to be the case I had to
4:27
use Clerk and Clerk has a very has a
4:30
very simple integration easily tying in
4:33
with Convex where in the Convix backend
4:35
you can have access to the user
4:37
information right away so that's why I
4:39
use Clerk we're using Convex for our
4:41
back end which is also the sponsor of
4:42
this video thank you so much Convex love
4:44
Convex i've been a convex show from the
4:47
beginning it's overall a great product
4:49
and now to see people like Theo uh join
4:51
the bandwagon it's an amazing thing
4:53
convex is not only our database not only
4:57
a place where we write our server
4:58
functions but it's where we it's a place
5:00
where we could set up long processes API
5:02
points like convex is truly the complete
5:05
backend so with this starter kit you can
5:07
pretty much build anything without
5:09
adding any external service the only
5:11
thing only external service you would
5:13
need to add that I didn't add here is
5:14
email and if you want me to add that let
5:16
me know in the comments down below and
5:18
finally for payments we're using Polar
5:21
and the reason why we're using Polar is
5:22
the developer experience for Polar is
5:24
just so fantastic i do have a Stripe
5:27
version um as well and if you want me to
5:29
release that let me know but I just
5:31
personally have been in love with
5:32
Polar's developer experience especially
5:34
when you get into usage based billing
5:36
and all that stuff so that is the React
5:39
Starter Kit in a nutshell and all of
5:41
this gets deployed to Verscell and I'm
5:43
going to show you how to do that so now
5:46
that you know all the stuff that's used
5:49
we are going to set this thing up
5:50
together so go to again React Starter
5:54
Kit it's literally I believe the first
5:56
one make sure you give it a lovely star
5:59
i can't star my own repo it's like
6:01
imagine liking your own Instagram post
6:03
it's weird so let's download the code
6:05
and get into it shall we so downloading
6:08
the zip
6:09
unzipping this going to move this into
6:12
desktop and then in desktop we're just
6:15
going to call this RSK YouTube just so I
6:18
can identify this properly i'm going to
6:21
use VS Code you can use cursor wind surf
6:24
whatever it is you like and then we're
6:27
just going to plop this over here we're
6:29
going to full screen this bring this
6:33
closer open our root.tsx pop open our
6:36
terminal so what we're going to do we're
6:38
going to install the packages now you're
6:39
going to have to do install--
6:43
legacy-p.deeps and -asheps and the
6:45
reason why is some of the packages with
6:47
React with us using React 19 some of the
6:49
packages might be like oh you need to
6:50
use React 18 but we're just going to be
6:52
nicely telling them no we're using React
6:54
19 so d-
6:57
legacy-ps so let's pop open localhost
7:00
5173 so it says no address provided to
7:03
convex react client so there are a bunch
7:06
of environment variables we're going to
7:07
need and all of them are provided here
7:10
now here's a simple quick one for you to
7:12
set up Convex just open a new terminal
7:15
and do mpx convex dev and what's going
7:19
to happen is it's going to ask you now
7:21
I've already logged in it'll probably
7:22
tell you to log in install some packages
7:24
all that stuff i already done that so
7:26
what I'm going to do is I'm going to
7:28
create a new project call it
7:31
rsk-2 uh we want to do cloud deployment
7:34
i don't want to use anything beta so
7:36
right off the bat if I look at my
7:38
m.local you see that the convex keys
7:41
have been taken care for me so we love
7:43
that now I'm going to go back to M.LE
7:46
convex keys are taken care of i need my
7:50
clerk keys so I'm just going to copy
7:52
this right here and I'm going to paste
7:54
it in my
7:56
m.local all right we're good to go so
7:59
let's go back to our browser let's go to
8:02
clerk and let's set up a new project
8:04
we'll call this RSK YouTube um I just
8:07
want email and Google you can add
8:08
whichever one you want this starter kit
8:10
gives you that freedom and all really
8:13
what we're going to do is I actually
8:14
want to go to configure and then I'll go
8:16
to API keys right here and then I'm
8:20
going to go to React Router copy these
8:24
keys as is and just Oh I copied again my
8:28
bad copy these keys as is and then paste
8:30
them right and last but not least it
8:31
seems like we need our front-end URL and
8:33
that's basically our local host so I can
8:35
literally go here copy this and paste
8:38
this remove the backslash at the end
8:40
let's go here and we're getting
8:42
environment variable oh and there's one
8:44
more next
8:46
public_convex URL so let's go back to
8:49
our local and then literally it's going
8:52
to be the same one here and the reason
8:53
why you might be wondering why do we
8:55
have this here and this here as well
8:57
there is a next.js JS helper function
8:59
from clerk from convex sorry that I use
9:02
once we've done this there's still some
9:04
environment variables we have to add on
9:06
convex so we're going to go back to our
9:08
convex.dev project we're going to click
9:11
on login i'm going to log in with my
9:13
GitHub account and I'm going to go to
9:15
this project
9:17
rsk-you i'm going to go to settings and
9:21
then environment variables now remember
9:23
I told you earlier that what's cool
9:25
about where is my diagram what's cool
9:28
about Clerk is they have the sick
9:29
integration with Convex we're going to
9:31
set that up right now so to set that up
9:33
you go back to Con uh Clerk click on
9:35
configure click on JWT templates and
9:38
then you're going to create a new
9:39
template click on convex now make sure
9:43
you click save i be forgetting sometimes
9:46
and it ends up not working cuz you
9:47
didn't save so click save and go back to
9:51
Convex and you're going to copy this
9:54
issuer right here so you're going to
9:56
copy that you're going to go to convex
9:58
remember settings environment variables
10:00
paste this in value and this has to be
10:03
viter frontend API URL so we're going to
10:08
click save here and then let's go back
10:11
let's refresh we're still getting an
10:13
error let's see what the error is so
10:15
it's telling us here cannot find public
10:17
function for subscriptions get available
10:20
plan so what I'm going to do I'm just
10:22
going to run the command again but
10:23
there's still some environment variables
10:24
we're missing so we see an error here
10:26
that the error is for subscription get
10:28
available plans and that's because we
10:30
have to set up our payments so let's go
10:33
to
10:36
sandbox.polar.sh now there's a
10:38
difference between
10:39
www.polar.sh and sandbox sandbox is the
10:42
test version and this is where you can
10:44
test with fake money and you want to do
10:45
this at first make sure everything is
10:47
rock solid then use uh production
10:50
environment so I'm going to create a new
10:52
organization we're going to call this
10:55
RSK um YouTube just so I know what is
10:59
what so we're going to create click
11:01
create and yeah let's just create a
11:04
sample one sas pro subscription we'll
11:07
just delete this or we'll call this
11:09
YouTube please
11:11
subscribe subscribe i I said subscribe
11:15
in my mind but I wrote subscription
11:17
that's funny and then pricing we'll do
11:19
$1,000 a month cuz we're baller like
11:22
that and we click create product right
11:25
and then we're just going to go to
11:27
dashboard because everything's set up
11:29
for us we're going to go to product so
11:30
we see our product here but if I go back
11:33
this is like the project I've already
11:35
set up you you see that I need a couple
11:37
more keys on um convex first of all I
11:41
need the front-end URL but I also need
11:44
polar access token polar organization ID
11:47
and polar web secret so let's get the
11:50
access token first let's go back to our
11:53
convex let me click add i'll just paste
11:56
polar access token and we're going to go
12:00
back
12:01
to polar click on setting and the access
12:06
token is basically here where you see
12:08
developers you're going to click new
12:11
token select all i'm just have no
12:13
expiration and we're just going to call
12:15
this prod i'm going to create this is my
12:19
access token copy this paste this we
12:23
have our access token what's next we
12:25
need our organization ID so I'm just
12:27
going to cop click add paste
12:31
polar_ization ID make sure the spellings
12:33
match exactly because if they don't it's
12:35
not going to work let's go to settings
12:39
general up top here is the organization
12:42
ID that was pretty simple we'll paste
12:44
this right here and then finally for
12:48
polar we need a web hook secret and the
12:50
way you get a web hook secret is is is
12:53
like this you click on URL and deploy
12:55
key click on show development
12:58
credentials and you're going to need the
13:01
HTTP actions URL just copy that click on
13:05
it and it copies go back to Polar click
13:08
on web hooks and then you're going to
13:10
click add endpoint here you're going to
13:12
click paste but this is just this is
13:14
just a URL we we need a specific route
13:17
that Polar can fire to to send our
13:19
payment information if we go back to our
13:22
code and we click on convex and we click
13:25
on http.ts and this is where we can
13:27
expose endpoints you're going to see
13:30
here I have an APR route called slash
13:34
payments/webhook and this basically if
13:37
you look at the handler and click on
13:39
payment web hook this basically stores
13:42
the payment information that we get from
13:45
polar so this is the endpoint I have to
13:48
give polar so it's the http action
13:53
URL/payments/web hook i'm going to
13:56
select format as raw generate a new
13:59
secret i'm going to copy
14:01
this and I'm going to go back to our
14:04
environment variables click add paste
14:06
this here and it is polar web hook
14:10
secret i'm going to paste this here now
14:13
one thing that I missed is I need to
14:15
select all of these and click create
14:17
sometimes you click generate you leave
14:19
and because you have not created this it
14:21
won't work so I'm going to select all of
14:23
these and I'm going to click create now
14:26
and our web hook has been created so I'm
14:29
going to click save the only thing
14:31
missing is my OpenAI API key you can go
14:33
to openai.com API get you a key that's
14:36
pretty simple i'm just going to copy
14:37
mine so if we go back to our codebase
14:39
and we just like run click command S
14:42
we'll see that we get no more errors now
14:45
if we go back to our local host we have
14:49
everything running this is fantastic i
14:53
even see my $1,000 a month subscription
14:56
and all of this is running now let me
14:58
click on login let's test the O
15:04
out and it's asking me to choose an
15:06
account okay choosing this email right
15:09
here yes I
15:12
confirm and I'm signed in okay awesome
15:15
now if I click subscribe now it'll take
15:18
me to this page and I'll click setup
15:20
checkout what's the error I get here so
15:23
it says input should be valid URL
15:26
relative URL without base doesn't work
15:27
and the reason why I got this error is
15:30
because I had the one environment key
15:32
missing front end URL so I'm going to
15:34
copy this right and I'm going to give my
15:37
front end URL but here's the problem
15:39
this is a local host this URL is only
15:42
local to me if I give this to Convex it
15:45
can't redirect me to localhost cuz it's
15:48
only local to me so how you get around
15:51
this is you're going to need Enro now
15:54
there's tons of videos out there but
15:56
Enro basically exposes your local host
15:58
to the internet so that way I can give
16:00
it to Convex for me to test so I'm going
16:03
to do Enro HTTP 3000 uh no not 3000 cuz
16:07
I'm not on port 3000 the port I'm on is
16:10
5173 and if you don't know how I know
16:12
I'm on 5173 look at the port localhost
16:15
5173 so I'm going to hit
16:17
enter and this is the URL I have access
16:22
to so if I go here and if I click on
16:25
this and I click open and I click visit
16:28
site but I get this I get blocked
16:29
request and basically what I have to do
16:31
it tells me here I have to go in
16:34
v.config.js and basically in allowed
16:36
host add this endpoint URL so I'm going
16:39
to copy this and I basically have it
16:41
here under define config
16:44
server allowed hosts it's an array and I
16:48
just uncomment this hit save and when I
16:51
refresh you'll see that I'm brought back
16:53
here so this is exposed to the internet
16:55
so what I'm going to do is I'm going to
16:57
copy this and in my project I'm going to
17:01
paste this and then frontend URL I'm
17:04
going to paste this here make sure to
17:06
always remove the slash because in the
17:10
code it's going to add a slash and it's
17:11
two slashes and it breaks and when
17:13
you're ready to deploy this swap this
17:15
for your actual URL or for the versel
17:17
URL right so I'm going to click save and
17:21
now we're going to test out on Enro so
17:25
I'm going to log in this time we'll use
17:27
the we'll still use the same email just
17:29
to make sure everything is working
17:31
smoothly michael SEO 96 signed in
17:34
successfully now let's pay the $1,000 a
17:38
month brought to my checkout email is
17:42
already prefilled we're going to do the
17:43
test credit card 4242 42 4242 random
17:47
credentials just going to put my name
17:49
we'll put Canada as the country cuz
17:52
that's where I am ontario as the
17:54
province and I'm going to click
17:57
subscribe for $1,000 a month all I need
17:59
is 10 of these and I'm making 10 bands a
18:01
month what a beautiful time to be alive
18:04
and it says the payment was successful
18:06
i'm going to click go to dashboard now
18:08
one thing I want you to realize once
18:09
you're done uh once the payment has went
18:11
through you're on the dashboard you can
18:13
switch back to local host cuz Enro is
18:15
pretty slow so I'm on localhost right
18:17
now you can see I have access to the
18:19
dashboard if I click on settings you can
18:21
see I'm subscribed here and if I click
18:23
on manage subscription it'll take me to
18:26
the portal now the moment of truth is if
18:28
all this information is in my database
18:31
so I'm going to click on data and then I
18:33
see the subscription which it's correct
18:36
status active i see user it's correct
18:41
now if I went to polar and I clicked on
18:45
sales and then subscription and I got on
18:47
this subscription the one I just
18:49
subscribed to and I just cancel the
18:51
subscription like immediately meaning
18:53
canceled it right now now you would
18:54
never do this but I just want to make
18:56
sure that the web hook is set up
18:58
properly i'm going to cancel the
18:59
subscription so it's completely
19:01
cancelled if I go to subscriptions
19:05
now it says revoked so it works so we
19:11
have everything properly set up so
19:14
everything works so from this point on
19:16
you can push this to GitHub and then
19:18
deploy to Verscell so you can have
19:20
something online or you can now use your
19:22
favorite ID cursor Windsor VS Code Jet
19:25
Brain Zed whatever it is you can use AI
19:28
and you can build whatever you want with
19:30
payments authentication and a DB taking
19:33
care for you now this video is already
19:34
getting too long if you want me to dive
19:36
into the code and explain to you the way
19:38
I did things why I did things or if you
19:40
just want to see the next starter kit
19:41
which is the NextJS starter kit let me
19:43
know in the comments down below i hope
19:45
you enjoyed this i really took time
19:47
building this for you guys so I would
19:48
love and appreciate likes comments
19:50
sharing this video making sure you go to
19:52
the repo and starring it i've been Ross
19:55
you've been awesome i thank you so much
19:56
for watching this video again you can
19:58
check out the starter kit at
20:00
reactstarter.xyz till the next video you
20:02
have a blessed one